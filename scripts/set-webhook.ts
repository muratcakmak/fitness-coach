/**
 * Set the Telegram webhook URL for your bot.
 *
 * Usage:
 *   TELEGRAM_BOT_TOKEN=xxx WEBHOOK_SECRET=yyy WORKER_URL=https://your-worker.workers.dev npx tsx scripts/set-webhook.ts
 */

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.WEBHOOK_SECRET;
const workerUrl = process.env.WORKER_URL;

if (!token || !secret || !workerUrl) {
  console.error("Required env vars: TELEGRAM_BOT_TOKEN, WEBHOOK_SECRET, WORKER_URL");
  process.exit(1);
}

const webhookUrl = `${workerUrl}/webhook/${secret}`;

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: webhookUrl,
    allowed_updates: ["message"],
  }),
});

const data = await res.json();
console.log("Set webhook result:", JSON.stringify(data, null, 2));
