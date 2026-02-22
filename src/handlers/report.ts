import type { Context } from "grammy";
import type { Env } from "../config";
import { getUser, getDailyTotals } from "../db/queries";
import { generateWeeklyReport } from "../services/summary";
import { formatDailyReport, todayDateString } from "../utils/formatting";

export async function handleReport(ctx: Context, env: Env): Promise<void> {
  const telegramId = ctx.from!.id;
  const user = await getUser(env, telegramId);
  if (!user || user.onboarding_step < 6) {
    await ctx.reply("Please complete onboarding first with /start");
    return;
  }

  const today = todayDateString(user.timezone);
  const totals = await getDailyTotals(env, telegramId, today);

  const report = formatDailyReport(totals, {
    calories: user.target_calories!,
    protein: user.target_protein_g!,
    fat: user.target_fat_g!,
    carbs: user.target_carbs_g!,
  });

  await ctx.reply(report, { parse_mode: "Markdown" });
}

export async function handleWeekly(ctx: Context, env: Env): Promise<void> {
  const telegramId = ctx.from!.id;
  const user = await getUser(env, telegramId);
  if (!user || user.onboarding_step < 6) {
    await ctx.reply("Please complete onboarding first with /start");
    return;
  }

  await ctx.reply("Generating your weekly report...");
  const report = await generateWeeklyReport(env, user);
  await ctx.reply(report, { parse_mode: "Markdown" });
}
