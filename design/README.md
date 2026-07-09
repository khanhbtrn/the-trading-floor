# Design Assets

Imported design exports from Claude design projects.

## TradingDeskView

- **Source:** `TradingDeskView-standalone.html` — original bundled export from Claude design
- **Component:** `src/components/trading-desk/TradingDeskView.tsx` — converted to React + TypeScript
- **Styles:** `src/components/trading-desk/TradingDeskView.css`

## NpcChat

- **Source:** `NpcChat-standalone.html` — original bundled export from Claude design
- **Component:** `src/components/npc-chat/NpcChatView.tsx` — converted to React + TypeScript
- **Styles:** `src/components/npc-chat/NpcChatView.css`
- **Adapter:** `src/components/ChatUI.tsx` — wires scripted dialogue into the HUD chat UI

The standalone HTML files use the DC runtime bundler format. React components preserve the visual design and wire into game state via props.
