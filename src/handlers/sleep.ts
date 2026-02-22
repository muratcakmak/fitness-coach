import type { Env } from "../config";
import { logSleep } from "../db/queries";

export async function handleSleep(env: Env, telegramId: number, data: Record<string, unknown>): Promise<void> {
  await logSleep(env, telegramId, {
    bed_time: (data.bed_time as string) ?? null,
    wake_time: (data.wake_time as string) ?? null,
    duration_hours: (data.duration_hours as number) ?? null,
    quality: (data.quality as number) ?? null,
    notes: (data.notes as string) ?? null,
  });
}
