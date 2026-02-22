-- Photo features migration
-- Run with: wrangler d1 execute fitness-coach-db --file=src/db/migrations/0002_photos.sql

ALTER TABLE meals ADD COLUMN photo_key TEXT;

CREATE TABLE progress_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER NOT NULL,
  photo_key TEXT NOT NULL,
  caption TEXT,
  logged_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);
CREATE INDEX idx_progress_user ON progress_photos(telegram_id, logged_at);

CREATE TABLE form_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER NOT NULL,
  photo_key TEXT NOT NULL,
  exercise_name TEXT,
  feedback TEXT,
  caption TEXT,
  logged_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);
CREATE INDEX idx_form_checks_user ON form_checks(telegram_id, logged_at);
