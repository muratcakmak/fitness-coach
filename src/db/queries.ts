import type { Env } from "../config";

export interface User {
  telegram_id: number;
  first_name: string | null;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  gender: "male" | "female" | null;
  activity_level: "sedentary" | "light" | "moderate" | "active" | "very_active" | null;
  goal: "lose_fat" | "maintain" | "build_muscle" | null;
  dietary_restrictions: string | null;
  target_calories: number | null;
  target_protein_g: number | null;
  target_fat_g: number | null;
  target_carbs_g: number | null;
  onboarding_step: number;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Meal {
  id: number;
  telegram_id: number;
  description: string;
  calories: number | null;
  protein_g: number | null;
  fat_g: number | null;
  carbs_g: number | null;
  meal_type: string | null;
  photo_key: string | null;
  logged_at: string;
}

export interface ProgressPhoto {
  id: number;
  telegram_id: number;
  photo_key: string;
  caption: string | null;
  logged_at: string;
}

export interface FormCheck {
  id: number;
  telegram_id: number;
  photo_key: string;
  exercise_name: string | null;
  feedback: string | null;
  caption: string | null;
  logged_at: string;
}

export interface Workout {
  id: number;
  telegram_id: number;
  description: string;
  exercises: string | null;
  duration_min: number | null;
  type: string | null;
  logged_at: string;
}

export interface SleepLog {
  id: number;
  telegram_id: number;
  bed_time: string | null;
  wake_time: string | null;
  duration_hours: number | null;
  quality: number | null;
  notes: string | null;
  logged_at: string;
}

export interface BodyMetric {
  id: number;
  telegram_id: number;
  weight_kg: number | null;
  body_fat_pct: number | null;
  waist_cm: number | null;
  logged_at: string;
}

export interface DailyTotals {
  total_calories: number;
  total_protein: number;
  total_fat: number;
  total_carbs: number;
  meal_count: number;
  workout_count: number;
  sleep_hours: number | null;
}

const db = (env: Env) => env.DB;

export async function getUser(env: Env, telegramId: number): Promise<User | null> {
  return db(env)
    .prepare("SELECT * FROM users WHERE telegram_id = ?")
    .bind(telegramId)
    .first<User>();
}

export async function upsertUser(env: Env, telegramId: number, data: Partial<User>): Promise<void> {
  const existing = await getUser(env, telegramId);
  if (existing) {
    const fields = Object.entries(data)
      .filter(([k]) => k !== "telegram_id")
      .map(([k]) => `${k} = ?`);
    const values = Object.entries(data)
      .filter(([k]) => k !== "telegram_id")
      .map(([, v]) => v);
    if (fields.length === 0) return;
    await db(env)
      .prepare(`UPDATE users SET ${fields.join(", ")}, updated_at = datetime('now') WHERE telegram_id = ?`)
      .bind(...values, telegramId)
      .run();
  } else {
    const allData = { telegram_id: telegramId, ...data };
    const keys = Object.keys(allData);
    const placeholders = keys.map(() => "?").join(", ");
    const values = Object.values(allData);
    await db(env)
      .prepare(`INSERT INTO users (${keys.join(", ")}) VALUES (${placeholders})`)
      .bind(...values)
      .run();
  }
}

export async function logMeal(env: Env, telegramId: number, meal: Omit<Meal, "id" | "telegram_id" | "logged_at">): Promise<number> {
  const result = await db(env)
    .prepare("INSERT INTO meals (telegram_id, description, calories, protein_g, fat_g, carbs_g, meal_type, photo_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id")
    .bind(telegramId, meal.description, meal.calories, meal.protein_g, meal.fat_g, meal.carbs_g, meal.meal_type, meal.photo_key ?? null)
    .first<{ id: number }>();
  return result!.id;
}

export async function logWorkout(env: Env, telegramId: number, workout: Omit<Workout, "id" | "telegram_id" | "logged_at">): Promise<void> {
  await db(env)
    .prepare("INSERT INTO workouts (telegram_id, description, exercises, duration_min, type) VALUES (?, ?, ?, ?, ?)")
    .bind(telegramId, workout.description, workout.exercises, workout.duration_min, workout.type)
    .run();
}

export async function logSleep(env: Env, telegramId: number, sleep: Omit<SleepLog, "id" | "telegram_id" | "logged_at">): Promise<void> {
  await db(env)
    .prepare("INSERT INTO sleep_logs (telegram_id, bed_time, wake_time, duration_hours, quality, notes) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(telegramId, sleep.bed_time, sleep.wake_time, sleep.duration_hours, sleep.quality, sleep.notes)
    .run();
}

export async function logBodyMetric(env: Env, telegramId: number, metric: Omit<BodyMetric, "id" | "telegram_id" | "logged_at">): Promise<void> {
  await db(env)
    .prepare("INSERT INTO body_metrics (telegram_id, weight_kg, body_fat_pct, waist_cm) VALUES (?, ?, ?, ?)")
    .bind(telegramId, metric.weight_kg, metric.body_fat_pct, metric.waist_cm)
    .run();
}

export async function getDailyTotals(env: Env, telegramId: number, date: string): Promise<DailyTotals> {
  const mealTotals = await db(env)
    .prepare(
      `SELECT
        COALESCE(SUM(calories), 0) as total_calories,
        COALESCE(SUM(protein_g), 0) as total_protein,
        COALESCE(SUM(fat_g), 0) as total_fat,
        COALESCE(SUM(carbs_g), 0) as total_carbs,
        COUNT(*) as meal_count
      FROM meals
      WHERE telegram_id = ? AND date(logged_at) = ?`
    )
    .bind(telegramId, date)
    .first<{ total_calories: number; total_protein: number; total_fat: number; total_carbs: number; meal_count: number }>();

  const workoutCount = await db(env)
    .prepare("SELECT COUNT(*) as count FROM workouts WHERE telegram_id = ? AND date(logged_at) = ?")
    .bind(telegramId, date)
    .first<{ count: number }>();

  const sleepLog = await db(env)
    .prepare("SELECT duration_hours FROM sleep_logs WHERE telegram_id = ? AND date(logged_at) = ? ORDER BY logged_at DESC LIMIT 1")
    .bind(telegramId, date)
    .first<{ duration_hours: number | null }>();

  return {
    total_calories: mealTotals?.total_calories ?? 0,
    total_protein: mealTotals?.total_protein ?? 0,
    total_fat: mealTotals?.total_fat ?? 0,
    total_carbs: mealTotals?.total_carbs ?? 0,
    meal_count: mealTotals?.meal_count ?? 0,
    workout_count: workoutCount?.count ?? 0,
    sleep_hours: sleepLog?.duration_hours ?? null,
  };
}

export async function getWeeklyData(env: Env, telegramId: number, startDate: string, endDate: string) {
  const meals = await db(env)
    .prepare(
      `SELECT date(logged_at) as day,
        SUM(calories) as calories, SUM(protein_g) as protein,
        SUM(fat_g) as fat, SUM(carbs_g) as carbs, COUNT(*) as meals
      FROM meals WHERE telegram_id = ? AND date(logged_at) BETWEEN ? AND ?
      GROUP BY date(logged_at)`
    )
    .bind(telegramId, startDate, endDate)
    .all();

  const workouts = await db(env)
    .prepare(
      `SELECT date(logged_at) as day, COUNT(*) as count, SUM(duration_min) as total_min
      FROM workouts WHERE telegram_id = ? AND date(logged_at) BETWEEN ? AND ?
      GROUP BY date(logged_at)`
    )
    .bind(telegramId, startDate, endDate)
    .all();

  const sleepLogs = await db(env)
    .prepare(
      `SELECT date(logged_at) as day, duration_hours, quality
      FROM sleep_logs WHERE telegram_id = ? AND date(logged_at) BETWEEN ? AND ?
      ORDER BY logged_at`
    )
    .bind(telegramId, startDate, endDate)
    .all();

  const metrics = await db(env)
    .prepare(
      `SELECT weight_kg, body_fat_pct, logged_at
      FROM body_metrics WHERE telegram_id = ? AND date(logged_at) BETWEEN ? AND ?
      ORDER BY logged_at`
    )
    .bind(telegramId, startDate, endDate)
    .all();

  return { meals: meals.results, workouts: workouts.results, sleepLogs: sleepLogs.results, metrics: metrics.results };
}

export async function getTodayMeals(env: Env, telegramId: number, date: string): Promise<Meal[]> {
  const result = await db(env)
    .prepare("SELECT * FROM meals WHERE telegram_id = ? AND date(logged_at) = ? ORDER BY logged_at")
    .bind(telegramId, date)
    .all<Meal>();
  return result.results;
}

export async function getWeekWorkoutCount(env: Env, telegramId: number, startDate: string, endDate: string): Promise<number> {
  const result = await db(env)
    .prepare("SELECT COUNT(*) as count FROM workouts WHERE telegram_id = ? AND date(logged_at) BETWEEN ? AND ?")
    .bind(telegramId, startDate, endDate)
    .first<{ count: number }>();
  return result?.count ?? 0;
}

export async function getLatestWeight(env: Env, telegramId: number): Promise<{ weight_kg: number; logged_at: string } | null> {
  return db(env)
    .prepare("SELECT weight_kg, logged_at FROM body_metrics WHERE telegram_id = ? AND weight_kg IS NOT NULL ORDER BY logged_at DESC LIMIT 1")
    .bind(telegramId)
    .first();
}

export async function getPreviousWeight(env: Env, telegramId: number): Promise<{ weight_kg: number; logged_at: string } | null> {
  return db(env)
    .prepare("SELECT weight_kg, logged_at FROM body_metrics WHERE telegram_id = ? AND weight_kg IS NOT NULL ORDER BY logged_at DESC LIMIT 1 OFFSET 1")
    .bind(telegramId)
    .first();
}

export async function getAllUsers(env: Env): Promise<User[]> {
  const result = await db(env).prepare("SELECT * FROM users WHERE onboarding_step >= 6").all<User>();
  return result.results;
}

export async function getRecentWorkouts(env: Env, telegramId: number, days: number): Promise<Workout[]> {
  const result = await db(env)
    .prepare("SELECT * FROM workouts WHERE telegram_id = ? AND logged_at >= datetime('now', ? || ' days') ORDER BY logged_at DESC")
    .bind(telegramId, -days)
    .all<Workout>();
  return result.results;
}

export async function getRecentSleep(env: Env, telegramId: number, days: number): Promise<SleepLog[]> {
  const result = await db(env)
    .prepare("SELECT * FROM sleep_logs WHERE telegram_id = ? AND logged_at >= datetime('now', ? || ' days') ORDER BY logged_at DESC")
    .bind(telegramId, -days)
    .all<SleepLog>();
  return result.results;
}

export async function getWeightHistory(env: Env, telegramId: number, days: number): Promise<BodyMetric[]> {
  const result = await db(env)
    .prepare("SELECT * FROM body_metrics WHERE telegram_id = ? AND logged_at >= datetime('now', ? || ' days') ORDER BY logged_at ASC")
    .bind(telegramId, -days)
    .all<BodyMetric>();
  return result.results;
}

export async function logProgressPhoto(env: Env, telegramId: number, photoKey: string, caption: string | null): Promise<void> {
  await db(env)
    .prepare("INSERT INTO progress_photos (telegram_id, photo_key, caption) VALUES (?, ?, ?)")
    .bind(telegramId, photoKey, caption)
    .run();
}

export async function logFormCheck(env: Env, telegramId: number, photoKey: string, exerciseName: string | null, feedback: string | null, caption: string | null): Promise<void> {
  await db(env)
    .prepare("INSERT INTO form_checks (telegram_id, photo_key, exercise_name, feedback, caption) VALUES (?, ?, ?, ?, ?)")
    .bind(telegramId, photoKey, exerciseName, feedback, caption)
    .run();
}

export async function getProgressPhotos(env: Env, telegramId: number, days: number): Promise<ProgressPhoto[]> {
  const result = await db(env)
    .prepare("SELECT * FROM progress_photos WHERE telegram_id = ? AND logged_at >= datetime('now', ? || ' days') ORDER BY logged_at DESC")
    .bind(telegramId, -days)
    .all<ProgressPhoto>();
  return result.results;
}

export async function getFormChecks(env: Env, telegramId: number, days: number): Promise<FormCheck[]> {
  const result = await db(env)
    .prepare("SELECT * FROM form_checks WHERE telegram_id = ? AND logged_at >= datetime('now', ? || ' days') ORDER BY logged_at DESC")
    .bind(telegramId, -days)
    .all<FormCheck>();
  return result.results;
}

export async function getMealPhotoStats(env: Env, telegramId: number, date: string): Promise<{ total: number; withPhoto: number }> {
  const result = await db(env)
    .prepare("SELECT COUNT(*) as total, COUNT(photo_key) as withPhoto FROM meals WHERE telegram_id = ? AND date(logged_at) = ?")
    .bind(telegramId, date)
    .first<{ total: number; withPhoto: number }>();
  return { total: result?.total ?? 0, withPhoto: result?.withPhoto ?? 0 };
}

export async function getWeeklyCheckInStatus(env: Env, telegramId: number, startDate: string, endDate: string): Promise<{ hasProgressPhoto: boolean; hasWeighIn: boolean; latestWeightKg: number | null; photoCompliancePct: number }> {
  const progressPhoto = await db(env)
    .prepare("SELECT COUNT(*) as count FROM progress_photos WHERE telegram_id = ? AND date(logged_at) BETWEEN ? AND ?")
    .bind(telegramId, startDate, endDate)
    .first<{ count: number }>();

  const weightEntry = await db(env)
    .prepare("SELECT weight_kg FROM body_metrics WHERE telegram_id = ? AND date(logged_at) BETWEEN ? AND ? AND weight_kg IS NOT NULL ORDER BY logged_at DESC LIMIT 1")
    .bind(telegramId, startDate, endDate)
    .first<{ weight_kg: number }>();

  const mealPhotos = await db(env)
    .prepare("SELECT COUNT(*) as total, COUNT(photo_key) as withPhoto FROM meals WHERE telegram_id = ? AND date(logged_at) BETWEEN ? AND ?")
    .bind(telegramId, startDate, endDate)
    .first<{ total: number; withPhoto: number }>();

  const total = mealPhotos?.total ?? 0;
  const withPhoto = mealPhotos?.withPhoto ?? 0;

  return {
    hasProgressPhoto: (progressPhoto?.count ?? 0) > 0,
    hasWeighIn: !!weightEntry,
    latestWeightKg: weightEntry?.weight_kg ?? null,
    photoCompliancePct: total > 0 ? Math.round((withPhoto / total) * 100) : 0,
  };
}
