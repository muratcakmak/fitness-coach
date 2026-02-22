import { describe, it, expect } from "vitest";
import { parseResponse } from "../../src/services/llm";

describe("parseResponse", () => {
  it("parses valid JSON with all fields", () => {
    const raw = JSON.stringify({
      intent: "meal",
      data: { description: "chicken", calories: 400 },
      reply: "Logged chicken.",
    });
    const result = parseResponse(raw);
    expect(result.intent).toBe("meal");
    expect(result.data).toEqual({ description: "chicken", calories: 400 });
    expect(result.reply).toBe("Logged chicken.");
  });

  it("defaults missing fields", () => {
    const raw = JSON.stringify({ something: "else" });
    const result = parseResponse(raw);
    expect(result.intent).toBe("greeting");
    expect(result.data).toEqual({});
    expect(result.reply).toBe("I didn't quite understand that. Could you try again?");
  });

  it("extracts JSON from markdown code blocks", () => {
    const raw = '```json\n{"intent":"workout","data":{"type":"cardio"},"reply":"Nice run."}\n```';
    const result = parseResponse(raw);
    expect(result.intent).toBe("workout");
    expect(result.data).toEqual({ type: "cardio" });
    expect(result.reply).toBe("Nice run.");
  });

  it("extracts JSON from code blocks without json label", () => {
    const raw = '```\n{"intent":"sleep","data":{},"reply":"Sleep logged."}\n```';
    const result = parseResponse(raw);
    expect(result.intent).toBe("sleep");
  });

  it("falls back to raw text on invalid JSON", () => {
    const raw = "I couldn't parse that as JSON";
    const result = parseResponse(raw);
    expect(result.intent).toBe("greeting");
    expect(result.data).toEqual({});
    expect(result.reply).toBe(raw);
  });

  it("falls back with sorry message on empty string", () => {
    const result = parseResponse("");
    expect(result.intent).toBe("greeting");
    expect(result.reply).toBe("Sorry, I had trouble processing that. Could you try again?");
  });

  it("parses food photo response with nested data structure (bug fix)", () => {
    const raw = JSON.stringify({
      intent: "meal",
      data: {
        description: "Grilled chicken salad",
        calories: 420,
        protein_g: 38,
        fat_g: 18,
        carbs_g: 22,
        meal_type: "lunch",
      },
      reply: "Grilled chicken salad — ~420 kcal, 38g protein.",
    });
    const result = parseResponse(raw);
    expect(result.intent).toBe("meal");
    expect(result.data.calories).toBe(420);
    expect(result.data.protein_g).toBe(38);
    expect(result.data.description).toBe("Grilled chicken salad");
    expect(result.reply).toContain("420 kcal");
  });

  it("handles nutrition label response with nested data structure (bug fix)", () => {
    const raw = JSON.stringify({
      intent: "meal",
      data: {
        description: "Protein Bar",
        calories: 200,
        protein_g: 20,
        fat_g: 8,
        carbs_g: 22,
        meal_type: "snack",
      },
      reply: "Scanned: Protein Bar — 200 kcal.",
    });
    const result = parseResponse(raw);
    expect(result.intent).toBe("meal");
    expect(result.data.calories).toBe(200);
  });
});
