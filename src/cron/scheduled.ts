import type { Env } from "../config";
import { getAllUsers } from "../db/queries";
import { generateMorningCheckin, generateEveningSummary, generateWeeklyReport, generateFridayPhotoReport, generateAfternoonCheckin } from "../services/summary";
import { getLocalHour, getLocalDayOfWeek } from "../utils/formatting";

const TELEGRAM_API = "https://api.telegram.org/bot";

async function sendMessage(env: Env, chatId: number, text: string): Promise<void> {
  await fetch(`${TELEGRAM_API}${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

interface TelegramMediaPhoto {
  type: "photo";
  media: string;
  caption?: string;
  parse_mode?: string;
}

async function sendMediaGroup(env: Env, chatId: number, media: TelegramMediaPhoto[]): Promise<void> {
  await fetch(`${TELEGRAM_API}${env.TELEGRAM_BOT_TOKEN}/sendMediaGroup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, media }),
  });
}

export async function handleScheduled(event: ScheduledEvent, env: Env): Promise<void> {
  const users = await getAllUsers(env);

  for (const user of users) {
    try {
      const localHour = getLocalHour(user.timezone, event.scheduledTime);
      const localDay = getLocalDayOfWeek(user.timezone, event.scheduledTime);

      if (localHour === 7) {
        // Morning check-in (with progress photo reminder on Mondays)
        const isMonday = localDay === 1;
        const message = await generateMorningCheckin(env, user, isMonday);
        await sendMessage(env, user.telegram_id, message);
      } else if (localHour === 21) {
        // Evening summary
        const message = await generateEveningSummary(env, user);
        await sendMessage(env, user.telegram_id, message);

        // Friday: also send photo collage + compliance report
        if (localDay === 5) {
          const report = await generateFridayPhotoReport(env, user);
          if (report.photos.length > 0) {
            const media: TelegramMediaPhoto[] = report.photos.map((url, i) => ({
              type: "photo" as const,
              media: url,
              ...(i === 0 ? { caption: report.caption, parse_mode: "Markdown" } : {}),
            }));
            await sendMediaGroup(env, user.telegram_id, media);
          } else {
            await sendMessage(env, user.telegram_id, report.caption);
          }
        }
      } else if (localHour === 14) {
        // Afternoon check-in
        const message = await generateAfternoonCheckin(env, user);
        await sendMessage(env, user.telegram_id, message);
      } else if (localHour === 9 && localDay === 1) {
        // Monday weekly report
        const message = await generateWeeklyReport(env, user);
        await sendMessage(env, user.telegram_id, message);
      }
    } catch (error) {
      console.error(`Cron error for user ${user.telegram_id}:`, error);
    }
  }
}
