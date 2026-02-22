export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  PHOTOS: R2Bucket;
  TELEGRAM_BOT_TOKEN: string;
  OPENROUTER_API_KEY: string;
  WEBHOOK_SECRET: string;
  BOT_NAME: string;
  DEFAULT_TIMEZONE: string;
  API_TOKEN: string;
  PHOTOS_PUBLIC_URL: string;
}

export const LLM_MODEL = "x-ai/grok-4-fast";
export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const MAX_CONTEXT_MESSAGES = 10;
export const CONTEXT_TTL_SECONDS = 3600;
export const DAILY_CACHE_TTL_SECONDS = 21600;
