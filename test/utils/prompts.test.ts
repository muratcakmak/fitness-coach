import { describe, it, expect } from "vitest";
import { buildSystemPrompt, FOOD_PHOTO_PROMPT, NUTRITION_LABEL_PROMPT, FORM_CHECK_PROMPT } from "../../src/utils/prompts";
import type { User, DailyTotals } from "../../src/db/queries";

const mockUser: User = {
  telegram_id: 123,
  first_name: "Test",
  age: 30,
  gender: "male",
  weight_kg: 80,
  height_cm: 180,
  activity_level: "moderate",
  goal: "fat_loss",
  dietary_restrictions: null,
  target_calories: 2000,
  target_protein_g: 160,
  target_fat_g: 67,
  target_carbs_g: 200,
  timezone: "Europe/Istanbul",
  onboarding_step: 6,
  created_at: "2024-01-01",
};

const mockTotals: DailyTotals = {
  total_calories: 800,
  total_protein: 60,
  total_fat: 30,
  total_carbs: 80,
  meal_count: 2,
  workout_count: 1,
  sleep_hours: 7.5,
};

describe("buildSystemPrompt", () => {
  it("includes user profile and daily targets", () => {
    const prompt = buildSystemPrompt(mockUser, mockTotals);
    expect(prompt).toContain("Test");
    expect(prompt).toContain("2000");
    expect(prompt).toContain("160");
    expect(prompt).toContain("800/2000");
  });

  it("includes JSON response format instruction", () => {
    const prompt = buildSystemPrompt(mockUser, mockTotals);
    expect(prompt).toContain('"intent"');
    expect(prompt).toContain('"data"');
    expect(prompt).toContain('"reply"');
  });
});

describe("photo prompts use nested data structure (bug fix)", () => {
  it("FOOD_PHOTO_PROMPT contains intent and data fields", () => {
    expect(FOOD_PHOTO_PROMPT).toContain('"intent": "meal"');
    expect(FOOD_PHOTO_PROMPT).toContain('"data"');
  });

  it("NUTRITION_LABEL_PROMPT contains intent and data fields", () => {
    expect(NUTRITION_LABEL_PROMPT).toContain('"intent": "meal"');
    expect(NUTRITION_LABEL_PROMPT).toContain('"data"');
  });

  it("FORM_CHECK_PROMPT contains intent and data fields", () => {
    expect(FORM_CHECK_PROMPT).toContain('"intent"');
    expect(FORM_CHECK_PROMPT).toContain('"data"');
  });
});
