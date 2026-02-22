import type { Env } from "../config";
import { logWorkout } from "../db/queries";

export async function handleWorkout(env: Env, telegramId: number, data: Record<string, unknown>): Promise<void> {
  await logWorkout(env, telegramId, {
    description: (data.description as string) ?? "Workout",
    exercises: typeof data.exercises === "string" ? data.exercises : JSON.stringify(data.exercises ?? []),
    duration_min: (data.duration_min as number) ?? null,
    type: (data.type as string) ?? null,
  });
}
