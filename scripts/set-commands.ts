/**
 * Register bot commands with Telegram so the command menu appears.
 *
 * Usage:
 *   TELEGRAM_BOT_TOKEN=xxx npx tsx scripts/set-commands.ts
 */

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error("Required: TELEGRAM_BOT_TOKEN env var");
  process.exit(1);
}

const commands = [
  { command: "report", description: "Today's nutrition & workout summary" },
  { command: "weekly", description: "Weekly trends & progress report" },
  { command: "progress", description: "Save a progress photo (attach photo)" },
  { command: "formcheck", description: "AI exercise form feedback (attach photo)" },
  { command: "label", description: "Scan a nutrition label (attach photo)" },
  { command: "timezone", description: "Set your timezone" },
  { command: "tip", description: "Get a Huberman or Ferriss tip" },
  { command: "help", description: "Show all commands & usage" },
  { command: "start", description: "Start onboarding / reset profile" },
];

const res = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ commands }),
});

const data = await res.json();
console.log("Set commands result:", JSON.stringify(data, null, 2));
