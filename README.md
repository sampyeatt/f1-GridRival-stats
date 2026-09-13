# F1 GridRival Stats

An analyst's bench for [GridRival](https://gridrival.com) fantasy F1. It ingests
real Formula 1 results, recomputes each driver's and constructor's GridRival
points and salary for every round, and shows cost, points, positions-to-gain-$
and an ease-to-gain index so you can decide who to buy.

## Stack

| | |
|---|---|
| Frontend | Angular 20 (standalone, zoneless, signals) + PrimeNG + Tailwind |
| Backend | Express 5 + Sequelize + TypeScript |
| Database | Postgres 17 |
| Results data | [Jolpica-F1](https://github.com/jolpica/jolpica-f1) (`api.jolpi.ca`) |
| Edge | nginx, serving the app and proxying `/api/` on one origin |

## Running it

```bash
docker compose up --build
```

Then open <http://localhost:8080>. The backend applies any pending migrations
before it accepts traffic.

Secrets are read from a `.env` file next to `docker-compose.yaml` at deploy
time and are **not** baked into the image. Start from the example:

```bash
cp .env.example .env
```

Required (compose refuses to start without them):

```
POSTGRES_PASSWORD=...     # used by both the db container and the backend
JWT_SECRET=...            # signs auth tokens; e.g. `openssl rand -base64 48`
RESEND_API_KEY=...        # confirmation and password-reset email
```

Optional:

| Variable | Default | Purpose |
|---|---|---|
| `POSTGRES_USER` | `f1-data-user` | Database user |
| `POSTGRES_DB` | `postgres` | Database name |
| `POSTGRES_PORT` | `5435` | Port Postgres listens on inside the network |
| `HTTP_PORT` | `8080` | Host port nginx is published on |
| `JOLPICA_USER_AGENT` | `F1GridRivalStats/0.3.0` | User-Agent sent to the results API |
| `SCHEDULER_ENABLED` | `true` | Set `false` to run the API without the ingest scheduler |
| `SCHEDULER_TICK_CRON` | `*/15 * * * *` | How often to check for due ingests |
| `SCHEDULER_SYNC_CRON` | `0 3 * * 1` | Weekly calendar and driver refresh |
| `CORS_ORIGINS` | unset | Comma-separated allowlist. Off by default — everything is same-origin |
| `JOLPICA_BASE_URL` | `https://api.jolpi.ca/ergast/f1` | Results API root |

## Local development

Two terminals, no containers:

```bash
cd backend  && npm install && npm run migrate && npm run dev     # :3000
cd frontend && npm install && npm start                          # :4200
```

`ng serve` proxies `/api` to `localhost:3000` (see `proxy.conf.json`), so the
frontend talks to your local backend rather than production. There is one
environment file and `API_URL` is empty — every request is same-origin in every
deployment.

## Getting data in

```bash
cd backend
npm run migrate                 # apply pending migrations
npm run backfill -- 2025        # ingest and score a whole season (~75 requests)
npm run grant-admin you@example.com
```

`grant-admin` exists because promoting a user is admin-only, so the first admin
has to be made out of band.

After that the scheduler takes over. It is shaped like a race weekend rather
than a poll: a round is checked 30 minutes after the flag, again at +2h and
+24h to catch stewards' decisions, and then every 6 hours while the result is
still provisional. On a week with no racing the tick is one indexed query and
no upstream call at all.

Everything it does is recorded in the `IngestRun` table and visible on the
**Scheduler** admin screen, which also has manual overrides. Ingest is
idempotent — every write is an upsert onto a composite key — so re-running a
round is always safe, and is the supported way to pick up a corrected
classification.

## Starting a new season

Two steps, both in the app:

1. **Seasons** → *Add Season* → the year. Marking a season current clears the
   flag on the previous one, so exactly one season is ever current and every
   screen follows it across.
2. **Scheduler** → **Rebuild season**. One pass over the whole season: the
   calendar, then the drivers and constructors, then every round that has been
   run, then the scores derived from them. Rounds still in the future are
   recorded as skipped and picked up later by the scheduler.

That is `POST /api/scheduler/season`, and it is the same `refreshSeason` the
`npm run backfill` script calls — the script is the way to run it without a
browser. It takes a few minutes: three upstream requests per round, and Jolpica
rate-limits. Safe to re-run at any point in a season.

## Backend commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server with reload |
| `npm test` | Vitest suite |
| `npm run typecheck` | Typecheck sources and tests |
| `npm run migrate` | Apply pending migrations (`-- down` rolls one back) |
| `npm run backfill -- <season>` | Ingest and score a full season |
| `npm run grant-admin <email>` | Promote an account to admin |
| `npm run fixtures:refresh` | Re-download the Jolpica test fixtures |

## How it fits together

```
api.jolpi.ca ──► ingest.service ──► Postgres ──► scoring ──► dashboard
                      │                │
                  RawIngest        IngestRun
              (raw payloads,     (what ran, what
               replay without     changed, what
               re-fetching)       failed)
```

Ingest writes only facts — positions, statuses, laps. Scoring derives points,
rank, cost and the dashboard indices from them and writes those back, so a
scoring change is a re-score over stored data rather than 75 more API requests.

The scoring rules live in `backend/src/services/scoring.ts` as pure functions
with no database access, and the point tables in `shared/constants.ts` are
configuration — they encode one league's settings.
