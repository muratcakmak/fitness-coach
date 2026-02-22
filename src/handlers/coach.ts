import type { Context } from "grammy";
import type { Env } from "../config";
import { getUser, getDailyTotals } from "../db/queries";
import type { User, DailyTotals } from "../db/queries";
import { parseUserMessage, parseFoodPhoto } from "../services/parser";
import { storePhoto } from "../services/photos";
import { handleMeal } from "./meal";
import { handleWorkout } from "./workout";
import { handleSleep } from "./sleep";
import { handleWeight } from "./metrics";
import { handleOnboardingStep } from "./onboarding";
import { handleProgressPhoto } from "./progress-photo";
import { handleFormCheck } from "./form-check";
import { handleLabelScan } from "./label";
import { todayDateString } from "../utils/formatting";

export async function handleMessage(ctx: Context, env: Env): Promise<void> {
  const telegramId = ctx.from!.id;
  const user = await getUser(env, telegramId);

  if (!user) {
    await ctx.reply("Welcome! Send /start to get started.");
    return;
  }

  // Handle onboarding flow
  if (user.onboarding_step < 6) {
    await handleOnboardingStep(ctx, env);
    return;
  }

  const today = todayDateString(user.timezone);
  const dailyTotals = await getDailyTotals(env, telegramId, today);

  // Handle photo messages
  if (ctx.message?.photo) {
    await handlePhotoMessage(ctx, env, user, dailyTotals);
    return;
  }

  const text = ctx.message?.text?.trim();
  if (!text) {
    await ctx.reply("Send me a text message or a food photo!");
    return;
  }

  try {
    const parsed = await parseUserMessage(env, user, dailyTotals, text);

    // Store structured data based on intent
    switch (parsed.intent) {
      case "meal":
        await handleMeal(env, telegramId, parsed.data);
        break;
      case "workout":
        await handleWorkout(env, telegramId, parsed.data);
        break;
      case "sleep":
        await handleSleep(env, telegramId, parsed.data);
        break;
      case "weight":
        await handleWeight(env, telegramId, parsed.data);
        break;
      // question and greeting: just reply, no data to store
    }

    await ctx.reply(parsed.reply, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error handling message:", error);
    await ctx.reply("Sorry, I had trouble processing that. Please try again.");
  }
}

type PhotoType = "food" | "progress" | "form_check" | "label";

function classifyPhoto(caption: string | undefined): PhotoType {
  if (!caption) return "food";
  const lower = caption.toLowerCase().trim();
  if (lower.startsWith("/progress")) return "progress";
  if (lower.startsWith("/formcheck")) return "form_check";
  if (lower.startsWith("/label")) return "label";
  return "food";
}

async function downloadPhoto(ctx: Context, env: Env): Promise<{ buffer: ArrayBuffer; base64: string }> {
  const photo = ctx.message!.photo!;
  const largest = photo[photo.length - 1];
  const file = await ctx.api.getFile(largest.file_id);
  const fileUrl = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
  const response = await fetch(fileUrl);
  const buffer = await response.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return { buffer, base64 };
}

function stripCommand(caption: string | undefined): string | null {
  if (!caption) return null;
  return caption.replace(/^\/(?:progress|formcheck|label)\s*/i, "").trim() || null;
}

async function handlePhotoMessage(
  ctx: Context,
  env: Env,
  user: User,
  dailyTotals: DailyTotals
): Promise<void> {
  const caption = ctx.message?.caption?.trim();
  const photoType = classifyPhoto(caption);
  const cleanCaption = stripCommand(caption);

  try {
    const { buffer, base64 } = await downloadPhoto(ctx, env);
    const telegramId = user.telegram_id;

    switch (photoType) {
      case "progress":
        await handleProgressPhoto(ctx, env, telegramId, buffer, cleanCaption);
        break;

      case "form_check":
        await handleFormCheck(ctx, env, user, dailyTotals, telegramId, buffer, base64, cleanCaption);
        break;

      case "label":
        await handleLabelScan(ctx, env, user, dailyTotals, telegramId, buffer, base64, cleanCaption);
        break;

      case "food":
      default: {
        const parsed = await parseFoodPhoto(env, user, dailyTotals, base64, caption);
        const photoKey = await storePhoto(env, telegramId, "food", buffer);
        await handleMeal(env, telegramId, parsed.data, photoKey);
        await ctx.reply(parsed.reply, { parse_mode: "Markdown" });
        break;
      }
    }
  } catch (error) {
    console.error("Error processing photo:", error);
    await ctx.reply("Sorry, I couldn't process that photo. Please try again.");
  }
}
