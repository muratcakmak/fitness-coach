import type { Env } from "./config";
import { createWebhookHandler } from "./bot";
import { handleScheduled } from "./cron/scheduled";
import { handleApiRequest } from "./api/routes";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // API endpoints
    if (url.pathname.startsWith("/api/")) {
      return handleApiRequest(request, url, env);
    }

    // Webhook endpoint for Telegram
    if (url.pathname === `/webhook/${env.WEBHOOK_SECRET}` && request.method === "POST") {
      try {
        const handler = createWebhookHandler(env);
        return await handler(request);
      } catch (error) {
        console.error("Webhook error:", error);
        return new Response("OK", { status: 200 }); // Always return 200 to Telegram
      }
    }

    // One-time setup: register bot commands with Telegram
    if (url.pathname === `/setup/${env.WEBHOOK_SECRET}` && request.method === "POST") {
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
      const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setMyCommands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commands }),
      });
      const result = await res.json();
      return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
    }

    // Health check
    if (url.pathname === "/health") {
      return new Response("OK", { status: 200 });
    }

    return new Response("Not found", { status: 404 });
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(handleScheduled(event, env));
  },
};
