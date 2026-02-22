import { LLM_MODEL, OPENROUTER_URL, type Env } from "../config";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
}

export interface ParsedResponse {
  intent: "meal" | "workout" | "sleep" | "weight" | "question" | "greeting";
  data: Record<string, unknown>;
  reply: string;
}

export async function callLLM(env: Env, messages: LLMMessage[], jsonMode = true): Promise<string> {
  const body: Record<string, unknown> = {
    model: LLM_MODEL,
    messages,
    max_tokens: 1024,
    temperature: 0.3,
  };
  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/fitness-coach-bot",
      "X-Title": "Fitness Coach Bot",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${text}`);
  }

  const result = (await response.json()) as { choices: Array<{ message: { content: string } }> };
  return result.choices[0].message.content;
}

export async function callLLMText(env: Env, messages: LLMMessage[]): Promise<string> {
  return callLLM(env, messages, false);
}

export function parseResponse(raw: string): ParsedResponse {
  try {
    // Try to extract JSON from the response if it's wrapped in markdown code blocks
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : raw.trim();
    const parsed = JSON.parse(jsonStr);
    return {
      intent: parsed.intent ?? "greeting",
      data: parsed.data ?? {},
      reply: parsed.reply ?? "I didn't quite understand that. Could you try again?",
    };
  } catch {
    return {
      intent: "greeting",
      data: {},
      reply: raw || "Sorry, I had trouble processing that. Could you try again?",
    };
  }
}
