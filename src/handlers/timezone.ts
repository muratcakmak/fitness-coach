import type { Context } from "grammy";
import type { Env } from "../config";
import { upsertUser } from "../db/queries";

export async function handleTimezone(ctx: Context, env: Env): Promise<void> {
  const tid = ctx.from?.id;
  if (!tid) return;

  const text = ctx.message?.text ?? "";
  const parts = text.split(/\s+/);
  const tz = parts[1];

  if (!tz) {
    await ctx.reply("Usage: `/timezone America/New_York`\nUse IANA format: America/New\\_York, Europe/London, Asia/Tokyo", { parse_mode: "Markdown" });
    return;
  }

  const valid = Intl.supportedValuesOf("timeZone");
  if (!valid.includes(tz)) {
    await ctx.reply("Invalid timezone. Use IANA format: `America/New_York`, `Europe/London`, `Asia/Tokyo`", { parse_mode: "Markdown" });
    return;
  }

  await upsertUser(env, tid, { timezone: tz });
  await ctx.reply(`Timezone updated to ${tz} ✓`);
}
