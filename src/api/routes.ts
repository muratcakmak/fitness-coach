import type { Env } from "../config";
import {
  getUser,
  getDailyTotals,
  getWeeklyData,
  getTodayMeals,
  getLatestWeight,
  getRecentWorkouts,
  getRecentSleep,
  getWeightHistory,
  getProgressPhotos,
  getFormChecks,
} from "../db/queries";
import { getPhotoUrl } from "../services/photos";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function error(message: string, status = 400): Response {
  return json({ error: message }, status);
}

export async function handleApiRequest(request: Request, url: URL, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "GET") {
    return error("Method not allowed", 405);
  }

  const token = url.searchParams.get("token");
  if (!token || token !== env.API_TOKEN) {
    return error("Unauthorized", 401);
  }

  const tid = Number(url.searchParams.get("tid"));
  if (!tid) {
    return error("Missing tid parameter");
  }

  const path = url.pathname;

  try {
    if (path === "/api/summary") {
      const user = await getUser(env, tid);
      if (!user) return error("User not found", 404);
      const today = new Date().toISOString().split("T")[0];
      const totals = await getDailyTotals(env, tid, today);
      const weekEnd = today;
      const weekStart = new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0];
      const weekly = await getWeeklyData(env, tid, weekStart, weekEnd);
      const latestWeight = await getLatestWeight(env, tid);
      return json({ user, totals, weekly, latestWeight });
    }

    if (path === "/api/meals") {
      const date = url.searchParams.get("date") || new Date().toISOString().split("T")[0];
      const meals = await getTodayMeals(env, tid, date);
      return json({ meals });
    }

    if (path === "/api/weekly") {
      const end = url.searchParams.get("end") || new Date().toISOString().split("T")[0];
      const start = url.searchParams.get("start") || new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0];
      const data = await getWeeklyData(env, tid, start, end);
      return json(data);
    }

    if (path === "/api/workouts") {
      const days = Number(url.searchParams.get("days")) || 30;
      const workouts = await getRecentWorkouts(env, tid, days);
      return json({ workouts });
    }

    if (path === "/api/sleep") {
      const days = Number(url.searchParams.get("days")) || 30;
      const sleepLogs = await getRecentSleep(env, tid, days);
      return json({ sleepLogs });
    }

    if (path === "/api/weight") {
      const days = Number(url.searchParams.get("days")) || 90;
      const metrics = await getWeightHistory(env, tid, days);
      return json({ metrics });
    }

    if (path === "/api/progress-photos") {
      const days = Number(url.searchParams.get("days")) || 90;
      const photos = await getProgressPhotos(env, tid, days);
      return json({
        photos: photos.map((p) => ({ ...p, url: getPhotoUrl(env, p.photo_key) })),
      });
    }

    if (path === "/api/form-checks") {
      const days = Number(url.searchParams.get("days")) || 90;
      const checks = await getFormChecks(env, tid, days);
      return json({
        formChecks: checks.map((c) => ({ ...c, url: getPhotoUrl(env, c.photo_key) })),
      });
    }

    return error("Not found", 404);
  } catch (err) {
    console.error("API error:", err);
    return error("Internal server error", 500);
  }
}
