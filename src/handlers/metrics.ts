import type { Env } from "../config";
import { logBodyMetric } from "../db/queries";

export async function handleWeight(env: Env, telegramId: number, data: Record<string, unknown>): Promise<void> {
  await logBodyMetric(env, telegramId, {
    weight_kg: (data.weight_kg as number) ?? null,
    body_fat_pct: (data.body_fat_pct as number) ?? null,
    waist_cm: (data.waist_cm as number) ?? null,
  });
}
