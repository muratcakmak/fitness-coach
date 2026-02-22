CREATE TABLE IF NOT EXISTS users (
  telegram_id INTEGER PRIMARY KEY,
  first_name TEXT,
  age INTEGER,
  weight_kg REAL,
  height_cm REAL,
  gender TEXT CHECK(gender IN ('male', 'female')),
  activity_level TEXT CHECK(activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal TEXT CHECK(goal IN ('lose_fat', 'maintain', 'build_muscle')),
  dietary_restrictions TEXT,
  target_calories INTEGER,
  target_protein_g INTEGER,
  target_fat_g INTEGER,
  target_carbs_g INTEGER,
  onboarding_step INTEGER DEFAULT 0,
  timezone TEXT DEFAULT 'Europe/Istanbul',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS meals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  calories INTEGER,
  protein_g REAL,
  fat_g REAL,
  carbs_g REAL,
  meal_type TEXT,
  photo_key TEXT,
  logged_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);

CREATE TABLE IF NOT EXISTS progress_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER NOT NULL,
  photo_key TEXT NOT NULL,
  caption TEXT,
  logged_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);

CREATE TABLE IF NOT EXISTS form_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER NOT NULL,
  photo_key TEXT NOT NULL,
  exercise_name TEXT,
  feedback TEXT,
  caption TEXT,
  logged_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);

CREATE TABLE IF NOT EXISTS workouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  exercises TEXT,
  duration_min INTEGER,
  type TEXT,
  logged_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);

CREATE TABLE IF NOT EXISTS sleep_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER NOT NULL,
  bed_time TEXT,
  wake_time TEXT,
  duration_hours REAL,
  quality INTEGER CHECK(quality BETWEEN 1 AND 5),
  notes TEXT,
  logged_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);

CREATE TABLE IF NOT EXISTS body_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER NOT NULL,
  weight_kg REAL,
  body_fat_pct REAL,
  waist_cm REAL,
  logged_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);

CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(telegram_id, logged_at);
CREATE INDEX IF NOT EXISTS idx_progress_user ON progress_photos(telegram_id, logged_at);
CREATE INDEX IF NOT EXISTS idx_form_checks_user ON form_checks(telegram_id, logged_at);
CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts(telegram_id, logged_at);
CREATE INDEX IF NOT EXISTS idx_sleep_user_date ON sleep_logs(telegram_id, logged_at);
CREATE INDEX IF NOT EXISTS idx_metrics_user_date ON body_metrics(telegram_id, logged_at);
