import type { Env } from "../config";
import { MAX_CONTEXT_MESSAGES, CONTEXT_TTL_SECONDS } from "../config";
import type { User, DailyTotals } from "../db/queries";
import { callLLM, parseResponse, type LLMMessage, type ParsedResponse } from "./llm";
import { buildSystemPrompt, FOOD_PHOTO_PROMPT } from "../utils/prompts";

export async function parseUserMessage(
  env: Env,
  user: User,
  dailyTotals: DailyTotals,
  messageText: string
): Promise<ParsedResponse> {
  const systemPrompt = buildSystemPrompt(user, dailyTotals);
  const context = await getConversationContext(env, user.telegram_id);

  const messages: LLMMessage[] = [
    { role: "system", content: systemPrompt },
    ...context,
    { role: "user", content: messageText },
  ];

  const raw = await callLLM(env, messages);
  const parsed = parseResponse(raw);

  await saveConversationContext(env, user.telegram_id, [
    ...context,
    { role: "user", content: messageText },
    { role: "assistant", content: parsed.reply },
  ]);

  return parsed;
}

export async function parseFoodPhoto(
  env: Env,
  user: User,
  dailyTotals: DailyTotals,
  photoBase64: string,
  caption?: string
): Promise<ParsedResponse> {
  const systemPrompt = buildSystemPrompt(user, dailyTotals);

  const userContent: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [
    { type: "image_url", image_url: { url: `data:image/jpeg;base64,${photoBase64}` } },
    { type: "text", text: caption ? `${FOOD_PHOTO_PROMPT}\nUser caption: ${caption}` : FOOD_PHOTO_PROMPT },
  ];

  const messages: LLMMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent },
  ];

  const raw = await callLLM(env, messages);
  const parsed = parseResponse(raw);
  // Wrap photo-parsed food data as a meal intent
  if (parsed.intent !== "meal") {
    parsed.intent = "meal";
  }
  return parsed;
}

async function getConversationContext(env: Env, telegramId: number): Promise<LLMMessage[]> {
  try {
    const key = `conv:${telegramId}`;
    const stored = await env.KV.get(key, "json");
    if (stored && Array.isArray(stored)) {
      return stored as LLMMessage[];
    }
  } catch {
    // KV miss or parse error
  }
  return [];
}

async function saveConversationContext(env: Env, telegramId: number, messages: LLMMessage[]): Promise<void> {
  const key = `conv:${telegramId}`;
  // Keep only last N user/assistant pairs
  const trimmed = messages.slice(-MAX_CONTEXT_MESSAGES * 2);
  try {
    await env.KV.put(key, JSON.stringify(trimmed), { expirationTtl: CONTEXT_TTL_SECONDS });
  } catch {
    // Non-critical
  }
}
