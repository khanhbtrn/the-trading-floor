/** Game state shape — locked in build plan spec lock. */

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
  scenarioId: string | null;
  tick: number;
  price: number;
  position: Position;
  cash: number;
  pnl: number;
  conductScore: number;
  auditTrail: AuditEntry[];
  currentInstruction: TradeInstruction | null;
  blocked: boolean;
  glitchActive: boolean;
  rank: Rank | null;
}

export type GameAction =
  | { type: 'RESET' }
  | { type: 'SET_SCENARIO'; scenarioId: string; startingCash: number }
  | { type: 'PATCH'; patch: Partial<GameState> };

export interface ScenarioConfig {
  id: string;
  displayName: string;
  ticker: string;
  dateRange: string;
  csvPath: string;
}
