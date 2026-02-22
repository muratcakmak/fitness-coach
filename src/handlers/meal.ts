import type { Env } from "../config";
import { logMeal } from "../db/queries";

export async function handleMeal(env: Env, telegramId: number, data: Record<string, unknown>, photoKey?: string): Promise<void> {
  await logMeal(env, telegramId, {
    description: (data.description as string) ?? "Meal",
    calories: (data.calories as number) ?? null,
    protein_g: (data.protein_g as number) ?? null,
    fat_g: (data.fat_g as number) ?? null,
    carbs_g: (data.carbs_g as number) ?? null,
    meal_type: (data.meal_type as string) ?? null,
    photo_key: photoKey ?? null,
  });
}
