export function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1");
}

export function progressBar(current: number, target: number, length = 10): string {
  const ratio = Math.min(current / target, 1);
  const filled = Math.round(ratio * length);
  const empty = length - filled;
  return "█".repeat(filled) + "░".repeat(empty) + ` ${Math.round(ratio * 100)}%`;
}

export function formatDailyReport(
  totals: { total_calories: number; total_protein: number; total_fat: number; total_carbs: number; meal_count: number; workout_count: number; sleep_hours: number | null },
  targets: { calories: number; protein: number; fat: number; carbs: number }
): string {
  const lines = [
    `*📊 Daily Report*`,
    ``,
    `*Calories:* ${Math.round(totals.total_calories)}/${targets.calories} kcal`,
    progressBar(totals.total_calories, targets.calories),
    ``,
    `*Protein:* ${Math.round(totals.total_protein)}/${targets.protein}g`,
    progressBar(totals.total_protein, targets.protein),
    ``,
    `*Fat:* ${Math.round(totals.total_fat)}/${targets.fat}g`,
    progressBar(totals.total_fat, targets.fat),
    ``,
    `*Carbs:* ${Math.round(totals.total_carbs)}/${targets.carbs}g`,
    progressBar(totals.total_carbs, targets.carbs),
    ``,
    `*Meals:* ${totals.meal_count} | *Workouts:* ${totals.workout_count}`,
  ];

  if (totals.sleep_hours !== null) {
    lines.push(`*Sleep:* ${totals.sleep_hours}h`);
  }

  const remaining_cal = targets.calories - totals.total_calories;
  const remaining_pro = targets.protein - totals.total_protein;
  if (remaining_cal > 0 || remaining_pro > 0) {
    lines.push(``);
    lines.push(`*Remaining:* ${Math.round(Math.max(0, remaining_cal))} kcal, ${Math.round(Math.max(0, remaining_pro))}g protein`);
  }

  return lines.join("\n");
}

export function todayDateString(timezone = "Europe/Istanbul"): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: timezone });
}

export function weekStartDate(timezone = "Europe/Istanbul"): string {
  const now = new Date();
  const local = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  const day = local.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday start
  local.setDate(local.getDate() - diff);
  return local.toISOString().split("T")[0];
}

export function yesterdayDateString(timezone = "Europe/Istanbul"): string {
  const now = new Date();
  const local = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  local.setDate(local.getDate() - 1);
  return local.toISOString().split("T")[0];
}

export function getLocalHour(timezone: string, scheduledTime: number): number {
  const date = new Date(scheduledTime);
  return parseInt(date.toLocaleString("en-US", { timeZone: timezone, hour: "numeric", hour12: false }), 10);
}

export function getLocalDayOfWeek(timezone: string, scheduledTime: number): number {
  const date = new Date(scheduledTime);
  const dayStr = date.toLocaleString("en-US", { timeZone: timezone, weekday: "short" });
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[dayStr] ?? 0;
}
