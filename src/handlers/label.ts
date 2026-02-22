import type { Context } from "grammy";
import type { Env } from "../config";
import type { User, DailyTotals } from "../db/queries";
import { storePhoto } from "../services/photos";
import { logMeal } from "../db/queries";
import { callLLM, parseResponse, type LLMMessage } from "../services/llm";
import { buildSystemPrompt, NUTRITION_LABEL_PROMPT } from "../utils/prompts";

export async function handleLabelScan(
  ctx: Context,
  env: Env,
  user: User,
  dailyTotals: DailyTotals,
  telegramId: number,
  buffer: ArrayBuffer,
  base64: string,
  caption: string | null
): Promise<void> {
  const messages: LLMMessage[] = [
    { role: "system", content: buildSystemPrompt(user, dailyTotals) },
    {
      role: "user",
      content: [
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } },
        { type: "text", text: caption ? `${NUTRITION_LABEL_PROMPT}\nUser caption: ${caption}` : NUTRITION_LABEL_PROMPT },
      ],
    },
  ];

  const raw = await callLLM(env, messages);
  const parsed = parseResponse(raw);
  parsed.intent = "meal";

  const photoKey = await storePhoto(env, telegramId, "label", buffer);

  await logMeal(env, telegramId, {
    description: (parsed.data.description as string) ?? "Nutrition label scan",
    calories: (parsed.data.calories as number) ?? null,
    protein_g: (parsed.data.protein_g as number) ?? null,
    fat_g: (parsed.data.fat_g as number) ?? null,
    carbs_g: (parsed.data.carbs_g as number) ?? null,
    meal_type: (parsed.data.meal_type as string) ?? null,
    photo_key: photoKey,
  });

  await ctx.reply(parsed.reply, { parse_mode: "Markdown" });
}
