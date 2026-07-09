/** Game state shape — architecture pivot (single dashboard). */

export type Rank = 'Junior Trader' | 'Associate' | 'VP' | 'Desk Head';

export type TradeAction = 'buy' | 'sell';

export interface Position {
  qty: number;
  avgPrice: number;
}

export interface TradeInstruction {
  action: TradeAction;
  sizePctOfCash: number;
  reason: string;
}

export type AuditSource =
  | 'ai-instructed'
  | 'player-override'
  | 'blocked'
  | 'glitch'
  | 'glitch-panic';

export interface AuditEntry {
  source: AuditSource;
  action?: TradeAction;
  size?: number;
  price?: number;
  tick?: number;
  resolved?: boolean;
  note?: string;
}

export interface GameState {
  playerId: string;
  playerName: string;
  rank: Rank;
  careerPnL: number;
  sessionPnL: number;
  position: Position;
  cash: number;
  pnl: number;
  currentScenarioId: string | null;
  conductScore: number;
  auditTrail: AuditEntry[];
  glitchActive: boolean;
}

export type GameAction =
  | { type: 'RESET' }
  | { type: 'INIT_PLAYER'; playerId: string; playerName: string }
  | { type: 'START_SESSION'; scenarioId: string; startingCash: number }
  | { type: 'END_SESSION'; sessionPnL: number; rank: Rank; careerPnL: number }
  | { type: 'PATCH'; patch: Partial<GameState> };

export interface ScenarioConfig {
  id: string;
  displayName: string;
  ticker: string;
  dateRange: string;
  csvPath: string;
}
