# Baby Tracker — Newborn Care App

Mobile-first web app for tracking Saif Hakimi's care. Warm & cozy aesthetic (cream, terracotta, sage, honey).

## Stack

| Layer | Tech |
|---|---|
| API | Hono + Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) + Drizzle ORM |
| Frontend | React 18 + Vite + TypeScript |

## Screens

- **Home** — daily stats, last activity, feed reminder
- **Timeline** — chronological event feed with date picker + category filters
- **Growth chart** — WHO percentile chart + history
- **Profile** — baby info, caregivers, doctor visits, preferences
- **Feeding** — breastfeeding timer (L/R) with live recording
- **Sleep** — dark-mode sleep tracker with waveform
- **Pumping** — dual L/R volume entry with timer
- **Diaper** — type selector (wet/dirty/mixed), consistency, color picker
- **Bath** — temp + duration logger with duck illustration
- **Growth entry** — weight / length / head measurement form with ± adjusters
- **Insights** — weekly patterns: sleep heatmap, feeds bar chart, diaper & pump stats

## Setup

### 1. Create the D1 database

```bash
cd api
npx wrangler d1 create baby-tracker
```

Copy the `database_id` from the output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "baby-tracker"
database_id = "your-actual-id-here"
```

### 2. Run migrations

```bash
# Local (dev)
pnpm --filter api db:migrate:local

# Remote (production)
pnpm --filter api db:migrate:remote
```

### 3. Run in development

Terminal 1 — API (Cloudflare Workers local):
```bash
pnpm --filter api dev
# runs on http://localhost:8787
```

Terminal 2 — Frontend:
```bash
pnpm --filter app dev
# runs on http://localhost:5173 (proxies /api → :8787)
```

### 4. Seed data

On first load the app automatically calls `POST /api/seed` which creates:
- Baby: Saif Hakimi (born 2026-02-23)
- Caregivers: Hakim (Dad), Lina (Mom), Mama Rosie (Grandma)
- Initial growth entries and doctor visit notes

You can also call it manually: `curl -X POST http://localhost:8787/api/seed`

## Deploy

```bash
# Deploy API to Cloudflare Workers
pnpm --filter api deploy

# Build and deploy frontend (to Cloudflare Pages, Vercel, etc.)
pnpm --filter app build
```

## API Reference

All routes are under `/api/`. Baby ID is `saif-hakimi`.

| Method | Path | Description |
|---|---|---|
| GET | `/api/babies/saif-hakimi` | Baby profile |
| GET | `/api/babies/saif-hakimi/feedings` | List feedings |
| POST | `/api/babies/saif-hakimi/feedings` | Log a feed |
| PUT | `/api/babies/saif-hakimi/feedings/:id` | Update feed (end timer) |
| GET | `/api/babies/saif-hakimi/sleeps` | List sleeps |
| POST | `/api/babies/saif-hakimi/sleeps` | Start sleep |
| PUT | `/api/babies/saif-hakimi/sleeps/:id` | Wake up (end sleep) |
| GET | `/api/babies/saif-hakimi/pumping` | List pump sessions |
| POST | `/api/babies/saif-hakimi/pumping` | Log pump session |
| GET | `/api/babies/saif-hakimi/diapers` | List diaper changes |
| POST | `/api/babies/saif-hakimi/diapers` | Log diaper change |
| GET | `/api/babies/saif-hakimi/baths` | List baths |
| POST | `/api/babies/saif-hakimi/baths` | Log bath |
| GET | `/api/babies/saif-hakimi/growth` | Growth history |
| POST | `/api/babies/saif-hakimi/growth` | Add measurement |
| GET | `/api/babies/saif-hakimi/visits` | Doctor visits |
| GET | `/api/babies/saif-hakimi/timeline` | All events for a day |
| GET | `/api/babies/saif-hakimi/stats/today` | Today's summary stats |
| GET | `/api/babies/saif-hakimi/stats/weekly` | 7-day aggregate |
| POST | `/api/seed` | Seed initial data |
