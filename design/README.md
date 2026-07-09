# Design Assets

Imported design exports from Claude design projects.

## TradingDeskView

- **Source:** `TradingDeskView-standalone.html` — original bundled export from Claude design
- **Component:** `src/components/trading-desk/TradingDeskView.tsx` — converted to React + TypeScript
- **Styles:** `src/components/trading-desk/TradingDeskView.css`

The standalone HTML uses the DC runtime bundler format. The React component preserves the visual design (HUD scanlines, SVG price chart, order ticket, P&L panel) and wires into game state via props.
