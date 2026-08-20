# Kelvi — Aarla Play

Kelvi is a live community game, not a quiz app.

A question drops. Players answer as fast as they can. Rankings, streaks, and weekly Aarla vouchers keep the room coming back.

**Kelvi drops → answer fast → see rank → protect streak → share result → return**

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind v4
- Prisma + SQLite (swap `DATABASE_URL` to PostgreSQL for production)
- Auth.js (NextAuth v5) with guest play, email magic link, optional Google/Apple
- Server-authoritative timers and first-attempt scoring

## Local setup

```bash
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

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

- Set `AUTH_SECRET`, `AUTH_URL`, and `DATABASE_URL` (PostgreSQL recommended).
- Add `GOOGLE_CLIENT_ID` / `APPLE_ID` when those providers should appear.
- Magic links currently print a demo URL; wire SMTP before public launch.
- Voucher redemption is manual in admin. No payments in this MVP.
- Share cards never include the question or answer. Native share / save image only — no auto-posting to Instagram.
