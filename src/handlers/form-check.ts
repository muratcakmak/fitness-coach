import type { Context } from "grammy";
import type { Env } from "../config";
import type { User, DailyTotals } from "../db/queries";
import { storePhoto } from "../services/photos";
import { logFormCheck } from "../db/queries";
import { callLLM, parseResponse, type LLMMessage } from "../services/llm";
import { buildSystemPrompt, FORM_CHECK_PROMPT } from "../utils/prompts";

export async function handleFormCheck(
  ctx: Context,
  env: Env,
  user: User,
  dailyTotals: DailyTotals,
  telegramId: number,
  buffer: ArrayBuffer,
  base64: string,
  caption: string | null
): Promise<void> {
  const photoKey = await storePhoto(env, telegramId, "form_check", buffer);

  const messages: LLMMessage[] = [
    { role: "system", content: buildSystemPrompt(user, dailyTotals) },
    {
      role: "user",
      content: [
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } },
        { type: "text", text: caption ? `${FORM_CHECK_PROMPT}\nUser caption: ${caption}` : FORM_CHECK_PROMPT },
      ],
    },
  ];

  const raw = await callLLM(env, messages);
  const parsed = parseResponse(raw);
  const exerciseName = (parsed.data.exercise_name as string) ?? null;
  const feedback = (parsed.data.feedback as string) ?? null;

  await logFormCheck(env, telegramId, photoKey, exerciseName, feedback, caption);
  await ctx.reply(parsed.reply, { parse_mode: "Markdown" });
}
