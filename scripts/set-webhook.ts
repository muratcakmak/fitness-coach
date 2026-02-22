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

// Set bot commands so Telegram shows the command menu
const commands = [
  { command: "report", description: "Today's nutrition & workout summary" },
  { command: "weekly", description: "Weekly trends & progress report" },
  { command: "progress", description: "Save a progress photo (attach photo)" },
  { command: "formcheck", description: "AI exercise form feedback (attach photo)" },
  { command: "label", description: "Scan a nutrition label (attach photo)" },
  { command: "timezone", description: "Set your timezone (e.g. /timezone America/New_York)" },
  { command: "tip", description: "Get a Huberman or Ferriss tip" },
  { command: "help", description: "Show all commands & usage" },
  { command: "start", description: "Start onboarding / reset profile" },
];

const cmdRes = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ commands }),
});

const cmdData = await cmdRes.json();
console.log("Set commands result:", JSON.stringify(cmdData, null, 2));
