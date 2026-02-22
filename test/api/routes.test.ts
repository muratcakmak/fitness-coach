import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleApiRequest } from "../../src/api/routes";

vi.mock("../../src/db/queries", () => ({
  getUser: vi.fn(),
  getDailyTotals: vi.fn(),
  getWeeklyData: vi.fn(),
  getTodayMeals: vi.fn(),
  getLatestWeight: vi.fn(),
  getRecentWorkouts: vi.fn(),
  getRecentSleep: vi.fn(),
  getWeightHistory: vi.fn(),
  getProgressPhotos: vi.fn(),
  getFormChecks: vi.fn(),
}));

vi.mock("../../src/services/photos", () => ({
  getPhotoUrl: vi.fn((_env: unknown, key: string) => `https://photos.example.com/${key}`),
}));

vi.mock("../../src/utils/formatting", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/utils/formatting")>();
  return {
    ...actual,
    todayDateString: vi.fn(() => "2024-06-15"),
    weekStartDate: vi.fn(() => "2024-06-10"),
  };
});

import { getUser, getTodayMeals, getDailyTotals, getWeeklyData, getLatestWeight } from "../../src/db/queries";
import { todayDateString } from "../../src/utils/formatting";

const mockEnv = {
  API_TOKEN: "test-token",
  DB: {},
  KV: {},
  PHOTOS: {},
  PHOTOS_PUBLIC_URL: "https://photos.example.com",
} as any;

const mockUser = {
  telegram_id: 123,
  first_name: "Test",
  timezone: "America/New_York",
  onboarding_step: 6,
  target_calories: 2000,
  target_protein_g: 160,
  target_fat_g: 67,
  target_carbs_g: 200,
};

function makeRequest(path: string): [Request, URL] {
  const url = new URL(`https://bot.example.com${path}`);
  return [new Request(url.toString()), url];
}

describe("API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for missing token", async () => {
    const [req, url] = makeRequest("/api/meals?tid=123");
    const res = await handleApiRequest(req, url, mockEnv);
    expect(res.status).toBe(401);
  });

  it("returns 401 for wrong token", async () => {
    const [req, url] = makeRequest("/api/meals?token=wrong&tid=123");
    const res = await handleApiRequest(req, url, mockEnv);
    expect(res.status).toBe(401);
  });

  it("returns 404 for unknown path", async () => {
    const [req, url] = makeRequest("/api/unknown?token=test-token&tid=123");
    const res = await handleApiRequest(req, url, mockEnv);
    expect(res.status).toBe(404);
  });

  it("/api/meals includes photo URL when photo_key present (bug fix)", async () => {
    vi.mocked(getUser).mockResolvedValue(mockUser as any);
    vi.mocked(getTodayMeals).mockResolvedValue([
      { id: 1, telegram_id: 123, description: "Chicken", calories: 400, protein_g: 38, fat_g: 12, carbs_g: 5, meal_type: "lunch", photo_key: "123/food/abc.jpg", logged_at: "2024-06-15" },
      { id: 2, telegram_id: 123, description: "Rice", calories: 200, protein_g: 4, fat_g: 1, carbs_g: 44, meal_type: "lunch", photo_key: null, logged_at: "2024-06-15" },
    ]);

    const [req, url] = makeRequest("/api/meals?token=test-token&tid=123");
    const res = await handleApiRequest(req, url, mockEnv);
    const body = await res.json() as any;

    expect(body.meals[0].url).toBe("https://photos.example.com/123/food/abc.jpg");
    expect(body.meals[1].url).toBeUndefined();
  });

  it("/api/meals uses user timezone not UTC (bug fix)", async () => {
    vi.mocked(getUser).mockResolvedValue(mockUser as any);
    vi.mocked(getTodayMeals).mockResolvedValue([]);

    const [req, url] = makeRequest("/api/meals?token=test-token&tid=123");
    await handleApiRequest(req, url, mockEnv);

    // todayDateString should be called with user's timezone
    expect(todayDateString).toHaveBeenCalledWith("America/New_York");
    // getTodayMeals should receive the timezone-aware date
    expect(getTodayMeals).toHaveBeenCalledWith(mockEnv, 123, "2024-06-15");
  });

  it("/api/summary uses user timezone (bug fix)", async () => {
    vi.mocked(getUser).mockResolvedValue(mockUser as any);
    vi.mocked(getDailyTotals).mockResolvedValue({ total_calories: 0, total_protein: 0, total_fat: 0, total_carbs: 0, meal_count: 0, workout_count: 0, sleep_hours: null });
    vi.mocked(getWeeklyData).mockResolvedValue([]);
    vi.mocked(getLatestWeight).mockResolvedValue(null);

    const [req, url] = makeRequest("/api/summary?token=test-token&tid=123");
    await handleApiRequest(req, url, mockEnv);

    expect(todayDateString).toHaveBeenCalledWith("America/New_York");
  });
});
