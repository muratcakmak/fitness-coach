import { Bot, webhookCallback } from "grammy";
import type { Env } from "./config";
import { handleStart, handleOnboardingStep } from "./handlers/onboarding";
import { handleReport, handleWeekly } from "./handlers/report";
import { handleMessage } from "./handlers/coach";
import { handleTimezone } from "./handlers/timezone";
import { getRandomWisdom } from "./data/wisdom";

export function createBot(env: Env) {
  const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

  bot.command("start", (ctx) => handleStart(ctx, env));
  bot.command("report", (ctx) => handleReport(ctx, env));
  bot.command("weekly", (ctx) => handleWeekly(ctx, env));
  bot.command("timezone", (ctx) => handleTimezone(ctx, env));
  bot.command("tip", (ctx) => {
    const w = getRandomWisdom();
    const source = w.source === "huberman" ? "Andrew Huberman" : "Tim Ferriss";
    return ctx.reply(`💡 ${w.text}\n— ${source}`);
  });
  bot.command("help", (ctx) =>
    ctx.reply(
      `*Fitness Coach Bot*\n\n` +
        `Just send me messages naturally:\n` +
        `• Describe meals to log nutrition\n` +
        `• Send food photos for auto-tracking\n` +
        `• Describe workouts to log exercise\n` +
        `• Tell me your sleep times\n` +
        `• Send your weight (e.g. "82.5 kg")\n` +
        `• Ask any fitness/nutrition question\n\n` +
        `*Commands:*\n` +
        `/report — Today's summary\n` +
        `/weekly — Weekly trends\n` +
        `/progress — Save progress photo\n` +
        `/formcheck — AI form feedback\n` +
        `/label — Scan nutrition label\n` +
        `/timezone — Set your timezone\n` +
        `/tip — Huberman or Ferriss tip\n` +
        `/start — Reset profile`,
      { parse_mode: "Markdown" }
    )
  );

  // Handle all other messages (text + photos)
  bot.on("message", (ctx) => handleMessage(ctx, env));

  return bot;
}

export function createWebhookHandler(env: Env) {
  const bot = createBot(env);
  return webhookCallback(bot, "cloudflare-mod");
}
