# Fitness Coach Bot

An AI-powered personal fitness coach that lives in Telegram. Built entirely on Cloudflare's edge stack — Workers, D1, KV, R2 — with grammY for the bot framework and OpenRouter (Grok-4) for AI.

Send a meal photo and get instant macro estimates. Describe a workout in plain English and it's logged. Ask about creatine and get a Huberman-cited answer. The bot tracks everything, sends timezone-aware daily/weekly check-ins, and holds you accountable with food photo compliance and progress photo reminders.

## What It Does

**Logging (natural language + photos):**
- Meals — text or photo, auto-parsed into calories/protein/fat/carbs
- Workouts — exercises, sets, reps, weight, duration
- Sleep — bed time, wake time, quality rating
- Weight & body metrics — trend tracking over time
- Nutrition labels — `/label` + photo for exact values
- Progress photos — `/progress` + photo, stored in R2
- Form checks — `/formcheck` + exercise photo for AI feedback

**Coaching:**
- Direct, evidence-based responses — no sycophancy, no fluff
- Huberman & Ferriss protocols cited when relevant
- Pattern detection (3+ days off target → called out)
- Daily tips from a curated wisdom database

**Accountability:**
- Morning check-in (7 AM local) — yesterday's recap + today's focus
- Evening summary (9 PM local) — macro status + food photo compliance
- Monday weekly report (9 AM local) — full week analysis + progress photo/weigh-in accountability
- All check-ins are timezone-aware per user

**Dashboard API:**
- REST endpoints for a web dashboard (summary, meals, workouts, sleep, weight, progress photos, form checks)

## Architecture

```
Telegram ──→ POST /webhook/SECRET ──→ Cloudflare Worker
                                          │
                                          ├──→ D1 (SQLite)     — all user data
                                          ├──→ KV              — conversation context cache
                                          ├──→ R2              — photo storage
                                          └──→ OpenRouter API  — LLM (Grok-4)

Cron (hourly) ──→ Worker ──→ per-user timezone check ──→ send check-ins
```

| Component | Technology |
|-----------|-----------|
| Runtime | Cloudflare Workers |
| Bot Framework | [grammY](https://grammy.dev) |
| Database | Cloudflare D1 (SQLite) |
| Cache | Cloudflare KV |
| Photo Storage | Cloudflare R2 |
| AI | [OpenRouter](https://openrouter.ai) → Grok-4 |
| Scheduling | Cron Triggers (hourly, timezone-aware) |
| Web Framework | [Hono](https://hono.dev) (API routes) |

## Project Structure

```
src/
├── index.ts                  # Worker entry — fetch handler + cron handler
├── bot.ts                    # grammY bot setup, command registration
├── config.ts                 # Env interface, LLM model config, constants
├── api/
│   └── routes.ts             # REST API endpoints (Hono)
├── cron/
│   └── scheduled.ts          # Timezone-aware cron dispatcher
├── data/
│   └── wisdom.ts             # 34 curated Huberman & Ferriss quotes
├── db/
│   ├── schema.sql            # Full DB schema
│   ├── queries.ts            # All database operations + types
│   └── migrations/
│       ├── 0001_initial.sql
│       └── 0002_photos.sql
├── handlers/
│   ├── coach.ts              # Main message router (text + photo classification)
│   ├── meal.ts               # Meal logging
│   ├── workout.ts            # Workout logging
│   ├── sleep.ts              # Sleep logging
│   ├── metrics.ts            # Weight/body metrics
│   ├── onboarding.ts         # 6-step profile setup
│   ├── progress-photo.ts     # Progress photo storage
│   ├── form-check.ts         # Exercise form analysis
│   ├── label.ts              # Nutrition label OCR
│   ├── report.ts             # /report and /weekly handlers
│   └── timezone.ts           # /timezone handler
├── services/
│   ├── llm.ts                # OpenRouter API calls (JSON + text modes)
│   ├── parser.ts             # LLM-powered message parsing with context
│   ├── nutrition.ts          # Mifflin-St Jeor BMR, TDEE, macro targets
│   ├── photos.ts             # R2 photo upload + URL generation
│   └── summary.ts            # Morning/evening/weekly report generation
└── utils/
    ├── formatting.ts         # Progress bars, date helpers, timezone utils
    └── prompts.ts            # All LLM system prompts
```

## Prerequisites

- [Node.js](https://nodejs.org) 18+
- [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier works)
- [Telegram bot token](https://t.me/BotFather) — message BotFather, send `/newbot`, follow prompts
- [OpenRouter API key](https://openrouter.ai) — sign up, add credits, copy key

## Setup (Step by Step)

### 1. Clone and install dependencies

```bash
git clone https://github.com/your-username/fitness-coach.git
cd fitness-coach
npm install
```

### 2. Create the config file

```bash
cp wrangler.toml.example wrangler.toml
```

You'll fill in the IDs in the next step.

### 3. Create Cloudflare resources

Log in to Wrangler if you haven't:

```bash
npx wrangler login
```

Create each resource and paste the returned IDs into `wrangler.toml`:

```bash
# Create the D1 database
npx wrangler d1 create fitness-coach-db
# Output will include: database_id = "abc-123-..."
# → Paste into wrangler.toml under [[d1_databases]]

# Create the KV namespace
npx wrangler kv namespace create KV
# Output will include: id = "abc123..."
# → Paste into wrangler.toml under [[kv_namespaces]]

# Create the R2 bucket
npx wrangler r2 bucket create fitness-coach-photos
```

Your `wrangler.toml` should now look like:

```toml
name = "fitness-coach"
main = "src/index.ts"
compatibility_date = "2024-12-05"

[[d1_databases]]
binding = "DB"
database_name = "fitness-coach-db"
database_id = "<your-database-id>"        # ← from d1 create output

[[kv_namespaces]]
binding = "KV"
id = "<your-kv-namespace-id>"             # ← from kv create output

[[r2_buckets]]
binding = "PHOTOS"
bucket_name = "fitness-coach-photos"

[triggers]
crons = ["0 * * * *"]

[vars]
BOT_NAME = "YourBotName"
DEFAULT_TIMEZONE = "UTC"
PHOTOS_PUBLIC_URL = "https://your-bucket.r2.dev"
```

For `PHOTOS_PUBLIC_URL`: go to Cloudflare Dashboard → R2 → your bucket → Settings → Public access, enable it, and copy the public URL.

### 4. Run database migrations

```bash
# Remote (production)
npm run db:migrate:remote

# Local (for development)
npm run db:migrate
```

### 5. Set secrets

These are stored securely in Cloudflare and never committed to git.

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
# Paste your bot token from BotFather

npx wrangler secret put OPENROUTER_API_KEY
# Paste your OpenRouter API key

npx wrangler secret put WEBHOOK_SECRET
# Any random string — used in the webhook URL path (e.g. generate with: openssl rand -hex 32)

npx wrangler secret put API_TOKEN
# Any random string — used to authenticate dashboard API requests
```

For local development, create a `.dev.vars` file (already in `.gitignore`):

```
TELEGRAM_BOT_TOKEN=your-bot-token
OPENROUTER_API_KEY=your-openrouter-key
WEBHOOK_SECRET=your-webhook-secret
API_TOKEN=your-api-token
```

### 6. Deploy

```bash
npm run deploy
```

This deploys the Worker and activates the hourly cron trigger.

### 7. Set the Telegram webhook

Tell Telegram where to send updates:

```bash
TELEGRAM_BOT_TOKEN=<your-token> \
WEBHOOK_SECRET=<your-secret> \
WORKER_URL=https://fitness-coach.<your-subdomain>.workers.dev \
npm run set-webhook
```

You should see `"ok": true` in the output.

### 8. Test it

Open your bot in Telegram and send `/start`. The bot will walk you through a 6-step onboarding (age, weight, height, gender, activity level, goal) and calculate your personalized macro targets.

Then try:
- `"Had 2 eggs and toast for breakfast"` → meal logged with macro estimates
- Send a food photo → auto-analyzed and logged
- `"Did bench press 4x8 at 70kg, took 45 minutes"` → workout logged
- `"82.5 kg"` → weight tracked
- `/tip` → random Huberman or Ferriss quote
- `/report` → today's progress with visual bars

### 9. Register bot commands with Telegram

This makes the command menu (/) appear in the Telegram UI:

```bash
TELEGRAM_BOT_TOKEN=<your-token> npx tsx scripts/set-commands.ts
```

## Testing

The project uses [Vitest](https://vitest.dev) for unit tests covering LLM response parsing, timezone utilities, API routes, and prompt structure.

```bash
npm test          # Run all tests
npx vitest        # Watch mode
```

## Claude Code Hook

A post-edit hook in `.claude/settings.json` automatically runs tests and deploys after every file edit:

```
Edit/Write → npx vitest run → npx wrangler deploy
```

Deploy only happens if all tests pass.

## Local Development

```bash
npm run db:migrate   # Set up local D1
npm run dev          # Start dev server on localhost:8787
```

For local testing with Telegram, you'll need a tunnel (e.g. `cloudflared tunnel` or `ngrok`) to expose localhost, then set the webhook to that URL.

## Environment Variables Reference

### Secrets (set via `wrangler secret put`)

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Bot token from [@BotFather](https://t.me/BotFather) |
| `OPENROUTER_API_KEY` | API key from [OpenRouter](https://openrouter.ai) |
| `WEBHOOK_SECRET` | Random string used in webhook URL path |
| `API_TOKEN` | Random string for authenticating dashboard API calls |

### Vars (set in `wrangler.toml` under `[vars]`)

| Variable | Description |
|----------|-------------|
| `BOT_NAME` | Display name used in LLM requests |
| `DEFAULT_TIMEZONE` | Fallback timezone for new users (IANA format, e.g. `UTC`) |
| `PHOTOS_PUBLIC_URL` | Public base URL for the R2 bucket |

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Begin 6-step onboarding |
| `/report` | Today's macro progress with visual bars |
| `/weekly` | AI-generated weekly trends report |
| `/progress` | Save a progress photo (send with photo attached) |
| `/formcheck` | Get AI form feedback (send with exercise photo) |
| `/label` | Scan a nutrition label (send with label photo) |
| `/timezone <tz>` | Set your timezone, e.g. `/timezone America/New_York` |
| `/tip` | Random evidence-based tip (Huberman or Ferriss) |
| `/help` | List all commands |

## Dashboard API

All endpoints require `?token=<API_TOKEN>&tid=<TELEGRAM_ID>`:

| Endpoint | Returns |
|----------|---------|
| `GET /api/summary` | User profile, today's totals, weekly data, latest weight |
| `GET /api/meals?date=YYYY-MM-DD` | Meals for a specific date |
| `GET /api/weekly?start=X&end=Y` | Weekly breakdown by day |
| `GET /api/workouts?days=30` | Recent workouts |
| `GET /api/sleep?days=30` | Recent sleep logs |
| `GET /api/weight?days=90` | Weight trend |
| `GET /api/progress-photos?days=90` | Progress photos with URLs |
| `GET /api/form-checks?days=90` | Form checks with feedback |

## Database Schema

6 tables: `users`, `meals`, `workouts`, `sleep_logs`, `body_metrics`, `progress_photos`, `form_checks`. See [`src/db/schema.sql`](src/db/schema.sql) for the full schema.

## How It Works

1. **Message arrives** → grammY routes it to the coach handler
2. **Intent classification** → LLM parses the message into one of: meal, workout, sleep, weight, question, greeting
3. **Data extraction** → structured data (calories, exercises, etc.) extracted in the same LLM call
4. **Storage** → data written to D1, photos to R2, conversation context cached in KV
5. **Response** → coaching reply sent back with current daily totals
6. **Cron (hourly)** → checks each user's local time, sends morning/evening/weekly messages at the right hour

## License

MIT
