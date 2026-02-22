import type { Env } from "../config";
import type { User } from "../db/queries";
import { getDailyTotals, getWeeklyData, getMealPhotoStats, getWeeklyCheckInStatus } from "../db/queries";
import { callLLMText, type LLMMessage } from "./llm";
import { MORNING_CHECKIN_PROMPT, EVENING_SUMMARY_PROMPT, WEEKLY_REPORT_PROMPT } from "../utils/prompts";
import { yesterdayDateString, todayDateString, weekStartDate } from "../utils/formatting";
import { getRandomWisdom } from "../data/wisdom";

const COACH_SYSTEM = "You are a direct, no-BS fitness coach. Be honest, firm, and brief. No sycophancy. State facts, give one actionable step.";

export async function generateMorningCheckin(env: Env, user: User): Promise<string> {
  const yesterday = yesterdayDateString(user.timezone);
  const totals = await getDailyTotals(env, user.telegram_id, yesterday);
  const prompt = MORNING_CHECKIN_PROMPT(user, totals);

  const messages: LLMMessage[] = [
    { role: "system", content: COACH_SYSTEM },
    { role: "user", content: prompt },
  ];
  const reply = await callLLMText(env, messages);
  const wisdom = getRandomWisdom();
  const source = wisdom.source === "huberman" ? "Andrew Huberman" : "Tim Ferriss";
  return `${reply}\n\n💡 _${wisdom.text}_\n— ${source}`;
}

export async function generateEveningSummary(env: Env, user: User): Promise<string> {
  const today = todayDateString(user.timezone);
  const totals = await getDailyTotals(env, user.telegram_id, today);
  const photoStats = await getMealPhotoStats(env, user.telegram_id, today);
  const prompt = EVENING_SUMMARY_PROMPT(user, totals, photoStats);

  const messages: LLMMessage[] = [
    { role: "system", content: COACH_SYSTEM },
    { role: "user", content: prompt },
  ];
  const reply = await callLLMText(env, messages);

  // Pick a tag-relevant tip
  const tags: ("nutrition" | "training")[] = [];
  if (totals.workout_count === 0) tags.push("training");
  if (totals.total_calories > 0 && totals.total_protein < (user.target_protein_g ?? 0) * 0.8) tags.push("nutrition");
  const wisdom = getRandomWisdom(tags.length > 0 ? tags : undefined);
  const source = wisdom.source === "huberman" ? "Andrew Huberman" : "Tim Ferriss";
  return `${reply}\n\n💡 _${wisdom.text}_\n— ${source}`;
}

export async function generateWeeklyReport(env: Env, user: User): Promise<string> {
  const today = todayDateString(user.timezone);
  const start = weekStartDate(user.timezone);
  const data = await getWeeklyData(env, user.telegram_id, start, today);
  const checkInStatus = await getWeeklyCheckInStatus(env, user.telegram_id, start, today);
  const prompt = WEEKLY_REPORT_PROMPT(user, JSON.stringify(data, null, 2), checkInStatus);

  const messages: LLMMessage[] = [
    { role: "system", content: COACH_SYSTEM },
    { role: "user", content: prompt },
  ];
  return callLLMText(env, messages);
}
