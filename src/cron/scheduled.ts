import type { Env } from "../config";
import { getAllUsers } from "../db/queries";
import { generateMorningCheckin, generateEveningSummary, generateWeeklyReport } from "../services/summary";
import { getLocalHour, getLocalDayOfWeek } from "../utils/formatting";

const TELEGRAM_API = "https://api.telegram.org/bot";

async function sendMessage(env: Env, chatId: number, text: string): Promise<void> {
  await fetch(`${TELEGRAM_API}${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

export async function handleScheduled(event: ScheduledEvent, env: Env): Promise<void> {
  const users = await getAllUsers(env);

  for (const user of users) {
    try {
      const localHour = getLocalHour(user.timezone, event.scheduledTime);
      const localDay = getLocalDayOfWeek(user.timezone, event.scheduledTime);

      if (localHour === 7) {
        // Morning check-in
        const message = await generateMorningCheckin(env, user);
        await sendMessage(env, user.telegram_id, message);
      } else if (localHour === 21) {
        // Evening summary
        const message = await generateEveningSummary(env, user);
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
