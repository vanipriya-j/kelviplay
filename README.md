# Kelvi — Aarla Play

Kelvi is a live community game, not a quiz app.

A question drops. Players answer as fast as they can. Rankings, streaks, and weekly Aarla vouchers keep the room coming back.

**Kelvi drops → answer fast → see rank → protect streak → share result → return**

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind v4
- Prisma + **Aarla OS Postgres on Supabase** (Kelvi tables in the `kelvi` schema)
- Auth.js (NextAuth v5) with guest play, email magic link, optional Google/Apple
- Server-authoritative timers and first-attempt scoring

## Database

Kelvi does not ship its own database. It uses the **Aarla OS Supabase** project — the same Postgres Aarla OS / Vercel already talk to.

Tables are isolated in schema `kelvi`, so commerce / OS tables in `public` are untouched. `db:setup` never migrates Aarla OS `public` tables. Seed wipes **Kelvi schema data only**.

1. In Supabase: **Connect** → copy the **Transaction pooler** URI (port **6543**) into `DATABASE_URL`. On Vercel, this is the same `DATABASE_URL` already set for kelviplay / aarla-os.
2. Optional: session pooler URI (port **5432**) as `DIRECT_URL`. If omitted, Kelvi derives it from `DATABASE_URL`.
3. Same database password as Aarla OS. Do not use `db.*.supabase.co` (IPv6-only) or the project API URL.

```bash
cp .env.example .env
# paste DATABASE_URL
npm install
npm run db:setup
npm run dev
```

Or paste `supabase/kelvi-complete.sql` in the Supabase SQL Editor (first time only), then run `npm run db:seed`. `npm run db:setup` is the Prisma CLI path: create schema `kelvi`, push tables, seed.

On Vercel, after `DATABASE_URL` is set, open **`/setup`** once and paste `AUTH_SECRET` (or `SETUP_SECRET` if you added one). That uses the Aarla OS database already configured for kelviplay.

Open [http://localhost:3000](http://localhost:3000). It lands on `/play`.

### Demo sign-in

On `/auth` (when `AUTH_DEMO=true` or in development):

- **Meera / Karthik / Ananya** — seeded players with weekly history
- **admin** — admin console at `/admin/kelvi`

Guests can play immediately. Account creation is required to keep streaks, enter the weekly board, and claim prizes.

## Routes

| Path | Purpose |
| --- | --- |
| `/play` | Aarla Play landing |
| `/play/kelvi` | Kelvi home (live or waiting) |
| `/play/kelvi/live` | Focused live question |
| `/play/kelvi/result/[attemptId]` | Result, Faster Fingers, share |
| `/play/kelvi/leaderboard` | Weekly + current Kelvi |
| `/play/profile` | Player profile |
| `/admin/kelvi` | Live room dashboard |
| `/admin/kelvi/questions` | Schedule Kelvis |
| `/admin/kelvi/rewards` | Weekly vouchers |

## Scoring

Default (configurable per question / `AppConfig`):

- Correct base = 100
- Speed bonus: 0–3s +50, 3–5s +40, 5–10s +30, 10–20s +20, 20–30s +10, 30s+ +0
- Wrong = 0
- Streak = consecutive correct Kelvis

The client timer is display-only. Rankings use `submittedAt - startedAt` from the server. Refreshing does not reset the start time. The first valid attempt is stored (`playerId + questionId` unique).

## Scripts

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Production notes

- Set `AUTH_SECRET` and `DATABASE_URL` (Supabase transaction pooler :6543). `DIRECT_URL` is optional.
- On Vercel, the existing kelviplay `DATABASE_URL` is enough — same pooler URI as Aarla OS. Session-pooler URIs are rewritten to port 6543 unless `DATABASE_POOL_MODE=session`. Prisma also adds `pgbouncer=true` and `connection_limit=1` on Vercel.
- First deploy: open `/setup` and paste `AUTH_SECRET`. That creates schema `kelvi` and seeds questions. It does not touch Aarla OS `public` tables.
- Add `GOOGLE_CLIENT_ID` / `APPLE_ID` when those providers should appear.
- Magic links currently print a demo URL; wire SMTP before public launch.
- Voucher redemption is manual in admin. No payments in this MVP.
- Share cards never include the question or answer. Native share / save image only — no auto-posting to Instagram.
