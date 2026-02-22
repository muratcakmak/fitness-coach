import type { Env } from "../config";
import type { User } from "../db/queries";
import { getDailyTotals, getWeeklyData, getMealPhotoStats, getWeeklyCheckInStatus, getProgressPhotos } from "../db/queries";
import { callLLMText, type LLMMessage } from "./llm";
import { MORNING_CHECKIN_PROMPT, EVENING_SUMMARY_PROMPT, WEEKLY_REPORT_PROMPT, AFTERNOON_CHECKIN_PROMPT } from "../utils/prompts";
import { yesterdayDateString, todayDateString, weekStartDate } from "../utils/formatting";
import { getRandomWisdom } from "../data/wisdom";
import { getPhotoUrl } from "./photos";

const COACH_SYSTEM = "You are a direct, no-BS fitness coach. Be honest, firm, and brief. No sycophancy. State facts, give one actionable step.";

export async function generateMorningCheckin(env: Env, user: User, isMonday = false): Promise<string> {
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

  let result = `${reply}\n\n💡 *"${wisdom.text}"*\n— *${source}*`;
  if (isMonday) {
    result += `\n\n📸 *Weekly progress photo reminder*\nTake a front-facing photo today and send it with /progress. Same lighting, same pose, every week — that's how you track real change.`;
  }
  return result;
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
  return `${reply}\n\n💡 *"${wisdom.text}"*\n— *${source}*`;
}

export async function generateAfternoonCheckin(env: Env, user: User): Promise<string> {
  const today = todayDateString(user.timezone);
  const totals = await getDailyTotals(env, user.telegram_id, today);
  const prompt = AFTERNOON_CHECKIN_PROMPT(user, totals);

  const messages: LLMMessage[] = [
    { role: "system", content: COACH_SYSTEM },
    { role: "user", content: prompt },
  ];
  const reply = await callLLMText(env, messages);
  const wisdom = getRandomWisdom();
  const source = wisdom.source === "huberman" ? "Andrew Huberman" : "Tim Ferriss";
  return `${reply}\n\n💡 *"${wisdom.text}"*\n— *${source}*`;
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

export interface FridayPhotoReport {
  photos: string[];
  caption: string;
}

export async function generateFridayPhotoReport(env: Env, user: User): Promise<FridayPhotoReport> {
  const today = todayDateString(user.timezone);
  const start = weekStartDate(user.timezone);
  const progressPhotos = await getProgressPhotos(env, user.telegram_id, 7);
  const checkInStatus = await getWeeklyCheckInStatus(env, user.telegram_id, start, today);

  const photoUrls = progressPhotos.map((p) => getPhotoUrl(env, p.photo_key));

  const lines: string[] = [`*📸 Weekly Photo Report*`, ""];

  if (progressPhotos.length > 0) {
    lines.push(`${progressPhotos.length} progress photo${progressPhotos.length > 1 ? "s" : ""} this week.`);
  } else {
    lines.push(`No progress photos this week. You can't track what you don't measure — send one with /progress before the week ends.`);
  }

  lines.push("");
  lines.push(`*Meal photo compliance:* ${checkInStatus.photoCompliancePct}%`);
  if (checkInStatus.photoCompliancePct < 80) {
    lines.push(`Photo every meal — that's the standard. ${checkInStatus.photoCompliancePct}% doesn't cut it.`);
  } else if (checkInStatus.photoCompliancePct === 100) {
    lines.push(`Every meal documented. That's discipline.`);
  }

  lines.push("");
  if (checkInStatus.hasWeighIn && checkInStatus.latestWeightKg) {
    lines.push(`*Weigh-in:* ${checkInStatus.latestWeightKg} kg ✓`);
  } else {
    lines.push(`*Weigh-in:* Missing ✗ — step on the scale.`);
  }

  return { photos: photoUrls, caption: lines.join("\n") };
}
