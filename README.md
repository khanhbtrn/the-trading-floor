# The Trading Floor — Career Edition

Equity trading floor simulation with persistent career progression. Single dashboard at `/`.

## Stack

- Next.js 14 App Router
- Tailwind CSS + Framer Motion
- Supabase (`players`, `games` tables)
- Claude API (`/api/npc`, server-only `ANTHROPIC_API_KEY`)

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Unified dashboard (login → intro → desk) |
| `/api/players` | Create / fetch / mark intro complete |
| `/api/npc` | Manager, Compliance, Tech chat |
| `/api/session/end` | Persist session + update career |
| `/api/leaderboard` | Top 5 players |
| `/api/migrate/intro` | Idempotent `intro_completed` DDL |

## Game flow

1. **Login** — create player, store `playerId` in `localStorage`
2. **Intro** — first-session onboarding (skippable)
3. **Session** — Manager instruction → risk check → trade desk; Compliance on block; Tech at tick 20 glitch
4. **End session** — scorecard, rank update, Supabase persistence

## Conduct scoring

| Event | Δ |
|-------|---|
| Start session | 100 |
| Compliance override granted | −20 |
| Compliant resize after rejection | +10 |
| Glitch panic trade | −10 |

## Dev

```bash
npm install
npm run dev
npm run verify:game   # logic checks for playthrough QA
npm run build
```

## Vercel env vars

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
SUPABASE_DB_PASSWORD   # optional — auto-migration on deploy
```

## Playthrough QA (manual)

1. **Obey Manager** — compliant instruction → execute → end session
2. **Override path** — oversized instruction → Compliance justification → override → execute
3. **Reject path** — oversized → Compliance rejects → new compliant Manager instruction (+10 conduct)
4. **Glitch** — tick 20 freeze → Tech resolves → resume trading
5. **Persistence** — reload page; career P&L and rank match Supabase

## Roadmap (not built)

- GME / COVID scenarios (shown locked in dropdown)
- Rank-gated scenario unlocks
