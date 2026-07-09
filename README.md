# The Trading Floor

**Live demo:** [https://workspace-zeta-plum.vercel.app](https://workspace-zeta-plum.vercel.app)

A narrative equity-trading simulation set on a New York desk in **September 2008**. You are a junior trader trying to survive the tape, follow orders, navigate compliance, and build a career — with AI-powered coworkers who talk back.

---

## For judges — 60-second pitch

*The Trading Floor* is a single-page trading game where **every session is a story**. Your manager (**Big Buck Bro**) sizes your trades. Compliance can block reckless tickets. Tech support saves you when the feed glitches. Your choices — obey, escalate, panic, or negotiate — affect **conduct score**, **session P&L**, and **career rank**, all persisted to Supabase across play sessions.

The core loop is intentionally tight: **get instruction → execute on the desk → survive crises → end session → climb the ladder.**

---

## How to play (judge walkthrough)

1. **Open the live app** and enter a player name. Progress is saved server-side — return with the same name to resume your career.
2. **Skim the intro** (or skip) — you land on the trading desk with a live SPY price feed from real 2008 CSV data.
3. **Open Manager** (bottom comms dock) and give a market read. Within a few exchanges, Big Buck Bro issues a trade instruction.
4. **Check the active instruction** below the desk (`BUY/SELL X% — locked` or `unlocked`). Use the **ORDER TICKET** on the right and execute the correct side when unlocked.
5. **If risk blocks the trade** (position limit breach), open **Compliance**, justify the ticket, and request an override — or ask Manager for a compliant resize.
6. **Survive session events:**
   - **Market shock** (~12s in) — sudden gap-down; tape speeds up briefly.
   - **Feed glitch** (~20s in) — order ticket freezes; talk to **Tech** with what you see on the desk to restore the feed.
   - **Order timer** — 15 seconds to act once Manager sizes a ticket; pauses while you type.
7. **End Session** to save results, view the scorecard, and update career rank on the leaderboard.

### Three paths worth trying

| Path | What to do | What it tests |
|------|------------|---------------|
| **Clean execute** | Compliant Manager order → BUY/SELL on desk → End Session | Core loop, desk UI, persistence |
| **Compliance override** | Oversized order → justify to Compliance → execute → End Session | Risk gate + NPC negotiation |
| **Crisis recovery** | Play through tick 12 shock + tick 20 glitch → resolve with Tech | Pressure mechanics + desk-grounded AI |

---

## Game systems

### NPCs (Claude-powered)

| Persona | Role |
|---------|------|
| **Big Buck Bro** (Manager) | Issues trade instructions, pushes conviction, runs a 15s order countdown |
| **Compliance** | Enforces the 50% position limit; grants or denies overrides |
| **Tech** | Diagnoses feed glitches using only what is visible on your desk UI |

NPC replies are generated server-side via the Claude API (`/api/npc`). Persona voices and the JSON response contract are fixed in code; the model fills in dialogue and decisions.

### Conduct & career

| Event | Conduct Δ |
|-------|-----------|
| Session start | 100 |
| Compliance override granted | −20 |
| Compliant resize after rejection | +10 |
| Glitch panic trade (trading while frozen) | −10 |
| Manager order timer expired | −5 |

**Rank thresholds** (evaluated at session end):

| Rank | Career P&L | Conduct |
|------|------------|---------|
| Associate | ≥ $50,000 | ≥ 70 |
| VP | ≥ $200,000 | ≥ 80 |
| Desk Head | ≥ $500,000 | ≥ 90 |

### Scenarios

| Scenario | Status |
|----------|--------|
| **2008 Financial Crisis** (SPY) | Playable |
| GME Squeeze | Coming soon (locked in UI) |
| COVID Crash | Coming soon (locked in UI) |

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| UI | Tailwind CSS, Framer Motion, custom pixel trading desk |
| State | React Context + reducer (`GameProvider`) |
| Database | Supabase (`players`, `games`) |
| AI | Anthropic Claude (`claude-sonnet-4-6`) via `/api/npc` |
| Deploy | Vercel |

---

## Project structure

```
src/
  app/                    # Next.js routes + API handlers
  components/
    dashboard/            # Main game hub
    trading-desk/         # Live chart + order ticket
    npc-chat/             # NPC conversation UI
    floating-npc-comms/   # Mobile-first comms dock
  lib/
    npc.ts                # Persona prompts + response parsing
    gameReducer.ts        # Session state machine
    sessionRules.ts       # Risk gates + conduct rules
    rank.ts               # Career rank logic
public/data/
  scenario-2008.csv       # Historical SPY prices
```

### API routes

| Route | Purpose |
|-------|---------|
| `POST /api/players` | Create or resume player by name |
| `POST /api/npc` | Manager / Compliance / Tech chat |
| `POST /api/session/end` | Persist session + update career |
| `GET /api/leaderboard` | Top players by career P&L |

---

## Local development

```bash
npm install
npm run dev          # http://localhost:3000
npm run verify:game  # logic checks for rank, risk, NPC parsing
npm run build
```

### Environment variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
SUPABASE_DB_PASSWORD   # optional — runs intro migration on deploy
```

---

## Design notes

- **Desk-first AI** — Tech NPC prompts forbid asking about timestamps or off-screen data; chat is grounded in visible UI (LAST price, chart points, position, FEED FROZEN banner).
- **Narrative pressure** — Manager order countdown, mid-session market shock, and feed glitch all interrupt the core execute loop.
- **Persistent career** — sessions write to Supabase on End Session (and on logout if a session is active). Re-login with the same name restores rank and P&L.

---

## Roadmap

- [ ] GME and COVID scenarios (data + unlock rules)
- [ ] Rank-gated scenario access

---

## License

Private / competition submission — see repository owner for terms.
