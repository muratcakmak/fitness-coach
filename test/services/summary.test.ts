import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/db/queries", () => ({
  getDailyTotals: vi.fn(),
  getWeeklyData: vi.fn(),
  getMealPhotoStats: vi.fn(),
  getWeeklyCheckInStatus: vi.fn(),
  getProgressPhotos: vi.fn(),
}));

vi.mock("../../src/services/llm", () => ({
  callLLMText: vi.fn(() => "Coach says something."),
}));

vi.mock("../../src/services/photos", () => ({
  getPhotoUrl: vi.fn((_env: unknown, key: string) => `https://fitness-static.omc345.com/${key}`),
}));

vi.mock("../../src/data/wisdom", () => ({
  getRandomWisdom: vi.fn(() => ({ text: "Discipline is freedom.", source: "huberman" })),
}));

import { generateMorningCheckin, generateEveningSummary, generateAfternoonCheckin, generateFridayPhotoReport } from "../../src/services/summary";
import { getWeeklyCheckInStatus, getProgressPhotos, getDailyTotals, getMealPhotoStats } from "../../src/db/queries";

const mockUser = {
  telegram_id: 123,
  first_name: "Test",
  timezone: "Europe/Istanbul",
  target_protein_g: 160,
  target_calories: 2000,
} as any;

const mockEnv = {} as any;

describe("generateMorningCheckin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("includes progress photo reminder on Monday", async () => {
    vi.mocked(getDailyTotals).mockResolvedValue({
      total_calories: 0, total_protein: 0, total_fat: 0, total_carbs: 0,
      meal_count: 0, workout_count: 0, sleep_hours: null,
    });

    const result = await generateMorningCheckin(mockEnv, mockUser, true);
    expect(result).toContain("progress photo reminder");
    expect(result).toContain("/progress");
  });

  it("does not include photo reminder on other days", async () => {
    vi.mocked(getDailyTotals).mockResolvedValue({
      total_calories: 0, total_protein: 0, total_fat: 0, total_carbs: 0,
      meal_count: 0, workout_count: 0, sleep_hours: null,
    });

    const result = await generateMorningCheckin(mockEnv, mockUser, false);
    expect(result).not.toContain("progress photo reminder");
  });

  it("uses bold formatting for tip", async () => {
    vi.mocked(getDailyTotals).mockResolvedValue({
      total_calories: 0, total_protein: 0, total_fat: 0, total_carbs: 0,
      meal_count: 0, workout_count: 0, sleep_hours: null,
    });

    const result = await generateMorningCheckin(mockEnv, mockUser, false);
    expect(result).toContain('💡 *"Discipline is freedom."*');
    expect(result).toContain("— *Andrew Huberman*");
  });
});

describe("generateAfternoonCheckin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns today's progress with bold tip", async () => {
    vi.mocked(getDailyTotals).mockResolvedValue({
      total_calories: 1200, total_protein: 80, total_fat: 40, total_carbs: 120,
      meal_count: 2, workout_count: 0, sleep_hours: null,
    });

    const result = await generateAfternoonCheckin(mockEnv, mockUser);
    expect(result).toContain("Coach says something.");
    expect(result).toContain('💡 *"Discipline is freedom."*');
    expect(result).toContain("— *Andrew Huberman*");
  });
});

describe("generateEveningSummary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses bold formatting for tip", async () => {
    vi.mocked(getDailyTotals).mockResolvedValue({
      total_calories: 1800, total_protein: 150, total_fat: 60, total_carbs: 200,
      meal_count: 3, workout_count: 1, sleep_hours: 7,
    });
    vi.mocked(getMealPhotoStats).mockResolvedValue({ total: 3, withPhoto: 3 });

    const result = await generateEveningSummary(mockEnv, mockUser);
    expect(result).toContain('💡 *"Discipline is freedom."*');
    expect(result).toContain("— *Andrew Huberman*");
    expect(result).not.toContain("_Discipline is freedom._");
  });
});

describe("generateFridayPhotoReport", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns photo URLs when progress photos exist", async () => {
    vi.mocked(getProgressPhotos).mockResolvedValue([
      { id: 1, telegram_id: 123, photo_key: "123/progress/a.jpg", caption: null, logged_at: "2026-02-20" },
      { id: 2, telegram_id: 123, photo_key: "123/progress/b.jpg", caption: null, logged_at: "2026-02-22" },
    ]);
    vi.mocked(getWeeklyCheckInStatus).mockResolvedValue({
      hasProgressPhoto: true, hasWeighIn: true, latestWeightKg: 80, photoCompliancePct: 90,
    });

    const report = await generateFridayPhotoReport(mockEnv, mockUser);
    expect(report.photos).toHaveLength(2);
    expect(report.photos[0]).toContain("123/progress/a.jpg");
    expect(report.caption).toContain("2 progress photos");
    expect(report.caption).toContain("90%");
  });

  it("returns empty photos array with nudge when no progress photos", async () => {
    vi.mocked(getProgressPhotos).mockResolvedValue([]);
    vi.mocked(getWeeklyCheckInStatus).mockResolvedValue({
      hasProgressPhoto: false, hasWeighIn: false, latestWeightKg: null, photoCompliancePct: 50,
    });

    const report = await generateFridayPhotoReport(mockEnv, mockUser);
    expect(report.photos).toHaveLength(0);
    expect(report.caption).toContain("No progress photos");
    expect(report.caption).toContain("/progress");
    expect(report.caption).toContain("Missing");
  });

  it("praises 100% meal photo compliance", async () => {
    vi.mocked(getProgressPhotos).mockResolvedValue([]);
    vi.mocked(getWeeklyCheckInStatus).mockResolvedValue({
      hasProgressPhoto: false, hasWeighIn: true, latestWeightKg: 80, photoCompliancePct: 100,
    });

    const report = await generateFridayPhotoReport(mockEnv, mockUser);
    expect(report.caption).toContain("discipline");
  });
});
