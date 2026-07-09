# Trading Floor Game

Narrative trading simulation — Next.js 14 App Router + Tailwind.

## Stack

- **Next.js 14** (App Router)
- **Tailwind CSS**
- **React Context** (`GameProvider`) + `useReducer` game state
- **recharts**, **framer-motion**
- Session-only persistence (v1)

## Routes

| Route | Screen |
|-------|--------|
| `/select` | Scenario Select |
| `/briefing` | Morning Briefing |
| `/risk-check` | Risk Check |
| `/escalation` | Compliance Escalation |
| `/desk` | Trading Desk |
| `/scorecard` | Session Scorecard |

`/` redirects to `/select`.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Game State

`GameProvider` (`src/context/GameProvider.tsx`) holds the spec `GameState` shape. Navigation actions dispatch reducer updates and push the matching route.

## Design Imports

- `src/components/trading-desk/` — Trading Desk HUD
- `src/components/npc-chat/` — NPC chat HUD
- `design/` — original Claude design exports
