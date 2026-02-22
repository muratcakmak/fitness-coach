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
