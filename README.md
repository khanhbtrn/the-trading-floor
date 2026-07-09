# The Trading Floor — 2008 Edition

Equity trading floor simulation. Built per overnight build plan.

## Stack (Checkpoint 0)

- Next.js 14 App Router
- Tailwind CSS
- React Context (`GameProvider`) for game state
- recharts + framer-motion (installed; wired in later slices)

## Routes

| Route | Screen |
|-------|--------|
| `/select` | Scenario Select |
| `/briefing` | Morning Briefing |
| `/risk-check` | Risk Check |
| `/escalation` | Compliance Escalation |
| `/desk` | Trading Desk |
| `/scorecard` | Scorecard / Rank |

## Game State (spec lock)

```ts
{
  scenarioId, tick, price,
  position: { qty, avgPrice },
  cash, pnl, conductScore,
  auditTrail, currentInstruction,
  blocked, glitchActive, rank
}
```

## Dev

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Design shells (from v0)

- `src/components/trading-desk/TradingDeskView.tsx`
- `src/components/npc-chat/NpcChatView.tsx`
- `design/` — original exports
