import { describe, it, expect } from "vitest";
import {
  todayDateString,
  weekStartDate,
  getLocalHour,
  getLocalDayOfWeek,
  progressBar,
  escapeMarkdown,
} from "../../src/utils/formatting";

describe("todayDateString", () => {
  it("returns YYYY-MM-DD format", () => {
    const result = todayDateString("Europe/Istanbul");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("uses default timezone when none provided", () => {
    const result = todayDateString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("weekStartDate", () => {
  it("returns YYYY-MM-DD format", () => {
    const result = weekStartDate("Europe/Istanbul");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns a date on or before today", () => {
    const start = new Date(weekStartDate("UTC"));
    const today = new Date(todayDateString("UTC"));
    expect(start.getTime()).toBeLessThanOrEqual(today.getTime());
  });
});

describe("getLocalHour", () => {
  it("returns a number between 0 and 23", () => {
    const hour = getLocalHour("Europe/Istanbul", Date.now());
    expect(hour).toBeGreaterThanOrEqual(0);
    expect(hour).toBeLessThanOrEqual(23);
  });

  it("returns correct hour for a known timestamp", () => {
    // 2024-01-15T12:00:00Z = 15:00 in Istanbul (UTC+3)
    const ts = new Date("2024-01-15T12:00:00Z").getTime();
    const hour = getLocalHour("Europe/Istanbul", ts);
    expect(hour).toBe(15);
  });
});

describe("getLocalDayOfWeek", () => {
  it("returns a number between 0 and 6", () => {
    const day = getLocalDayOfWeek("UTC", Date.now());
    expect(day).toBeGreaterThanOrEqual(0);
    expect(day).toBeLessThanOrEqual(6);
  });

  it("returns correct day for a known timestamp", () => {
    // 2024-01-15 is a Monday
    const ts = new Date("2024-01-15T12:00:00Z").getTime();
    expect(getLocalDayOfWeek("UTC", ts)).toBe(1); // Monday
  });
});

describe("progressBar", () => {
  it("shows 0% for zero progress", () => {
    const bar = progressBar(0, 100);
    expect(bar).toContain("0%");
    expect(bar).toContain("░");
  });

  it("shows 50% for half progress", () => {
    const bar = progressBar(50, 100);
    expect(bar).toContain("50%");
  });

  it("shows 100% for full progress", () => {
    const bar = progressBar(100, 100);
    expect(bar).toContain("100%");
  });

  it("caps at 100% for over-target", () => {
    const bar = progressBar(200, 100);
    expect(bar).toContain("100%");
  });
});

describe("escapeMarkdown", () => {
  it("escapes special characters", () => {
    expect(escapeMarkdown("*bold*")).toBe("\\*bold\\*");
    expect(escapeMarkdown("_italic_")).toBe("\\_italic\\_");
    expect(escapeMarkdown("[link](url)")).toBe("\\[link\\]\\(url\\)");
  });

  it("returns plain text unchanged", () => {
    expect(escapeMarkdown("hello world")).toBe("hello world");
  });
});
