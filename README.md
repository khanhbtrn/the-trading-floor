# Trading Floor Game

A narrative trading simulation built as a client-side React + TypeScript single-page app. Navigate scripted scenarios from morning briefing through risk checks, compliance escalation, live trading, and a final scorecard.

## Stack

- **React 19 + TypeScript + Vite**
- **State:** `useReducer` with a single `GameState` source of truth
- **Charts:** Recharts
- **Persistence:** None (session-only, v1)

## Assumptions (Locked)

1. NPC dialogue is **scripted/branching** — no live LLM calls
2. Trading desk **auto-advances** ticks (2s default) with pause/play toggle
3. Conduct score starts at **100**; compliance overrides cost **-10** (configurable in `src/constants.ts`)
4. Audit trail includes **`DISCRETIONARY`** type for off-instruction trades
5. One risk-rule violation is enough to **block** — no partial pass
6. Scenario content lives in `/src/scenarios/`, not hardcoded in components

## Getting Started

```bash
npm install
npm run dev
```

```bash
npm run build
```

## Game Flow

```
SCENARIO_SELECT → BRIEFING → RISK_CHECK → [ESCALATION if blocked] → DESK → SCORECARD
```

## Scenario Content

Add new scenarios to `src/scenarios/` and register them in `src/scenarios/index.ts`.

## Rank Formula

```
score = pnl + (conductScore × 50)
Junior Trader: score < 0
Associate:     0 ≤ score < 5000
VP:            5000 ≤ score < 15000
Desk Head:     score ≥ 15000
```

Constants in `src/constants.ts`.
