import type { Context } from "grammy";
import type { Env } from "../config";
import { storePhoto } from "../services/photos";
import { logProgressPhoto } from "../db/queries";

export async function handleProgressPhoto(
  ctx: Context,
  env: Env,
  telegramId: number,
  buffer: ArrayBuffer,
  caption: string | null
): Promise<void> {
  const photoKey = await storePhoto(env, telegramId, "progress", buffer);
  await logProgressPhoto(env, telegramId, photoKey, caption);
  await ctx.reply("Progress photo saved ✓");
}
