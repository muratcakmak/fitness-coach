import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/services/llm", () => ({
  callLLM: vi.fn(),
  parseResponse: vi.fn(),
  callLLMText: vi.fn(),
}));

import { callLLM, parseResponse } from "../../src/services/llm";
import { parseUserMessage, parseFoodPhoto } from "../../src/services/parser";
import type { User, DailyTotals } from "../../src/db/queries";

const mockUser: User = {
  telegram_id: 123,
  first_name: "Test",
  age: 30,
  gender: "male",
  weight_kg: 80,
  height_cm: 180,
  activity_level: "moderate",
  goal: "lose_fat",
  dietary_restrictions: null,
  target_calories: 2000,
  target_protein_g: 160,
  target_fat_g: 67,
  target_carbs_g: 200,
  timezone: "Europe/Istanbul",
  onboarding_step: 6,
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
};

const mockTotals: DailyTotals = {
  total_calories: 800,
  total_protein: 60,
  total_fat: 30,
  total_carbs: 80,
  meal_count: 2,
  workout_count: 0,
  sleep_hours: null,
};

const kvStore: Record<string, string> = {};
const mockEnv = {
  KV: {
    get: vi.fn((key: string) => {
      const val = kvStore[key];
      return val ? JSON.parse(val) : null;
    }),
    put: vi.fn((key: string, value: string) => {
      kvStore[key] = value;
    }),
  },
  OPENROUTER_API_KEY: "test",
} as any;

describe("parseUserMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(kvStore).forEach((k) => delete kvStore[k]);
  });

  it("saves conversation context after parsing", async () => {
    vi.mocked(callLLM).mockResolvedValue("raw");
    vi.mocked(parseResponse).mockReturnValue({
      intent: "greeting",
      data: {},
      reply: "Hello!",
    });

    await parseUserMessage(mockEnv, mockUser, mockTotals, "hi");

    expect(mockEnv.KV.put).toHaveBeenCalledWith(
      "conv:123",
      expect.stringContaining('"hi"'),
      expect.any(Object)
    );
  });
});

describe("parseFoodPhoto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(kvStore).forEach((k) => delete kvStore[k]);
  });

  it("always returns intent meal", async () => {
    vi.mocked(callLLM).mockResolvedValue("raw");
    vi.mocked(parseResponse).mockReturnValue({
      intent: "greeting",
      data: { calories: 400 },
      reply: "Chicken logged.",
    });

    const result = await parseFoodPhoto(mockEnv, mockUser, mockTotals, "base64data");
    expect(result.intent).toBe("meal");
  });

  it("saves photo conversation context (bug fix)", async () => {
    vi.mocked(callLLM).mockResolvedValue("raw");
    vi.mocked(parseResponse).mockReturnValue({
      intent: "meal",
      data: { calories: 400 },
      reply: "Chicken logged.",
    });

    await parseFoodPhoto(mockEnv, mockUser, mockTotals, "base64data", "my lunch");

    expect(mockEnv.KV.put).toHaveBeenCalledWith(
      "conv:123",
      expect.stringContaining("[Food photo]"),
      expect.any(Object)
    );
  });

  it("saves photo context even without caption", async () => {
    vi.mocked(callLLM).mockResolvedValue("raw");
    vi.mocked(parseResponse).mockReturnValue({
      intent: "meal",
      data: {},
      reply: "Logged.",
    });

    await parseFoodPhoto(mockEnv, mockUser, mockTotals, "base64data");

    expect(mockEnv.KV.put).toHaveBeenCalledWith(
      "conv:123",
      expect.stringContaining("[Food photo]"),
      expect.any(Object)
    );
  });
});
