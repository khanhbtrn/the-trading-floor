/** Game state — Career Edition spec (source of truth). */

export type Rank = 'Junior Trader' | 'Associate' | 'VP' | 'Desk Head';

export type TradeAction = 'buy' | 'sell';

export interface Position {
  qty: number;
  avgPrice: number;
}

export interface TradeInstruction {
  action: TradeAction;
  sizeShares: number;
  /** Legacy AI field — resolved to sizeShares at apply time. */
  sizePctOfCash?: number;
  reason: string;
}

export type AuditSource =
  | 'ai-instructed'
  | 'player-override'
  | 'blocked'
  | 'glitch'
  | 'glitch-panic'
  | 'market-shock'
  | 'order-expired';

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
  sessionsPlayed: number;
  sessionPnL: number;
  position: Position;
  cash: number;
  pnl: number;
  currentScenarioId: string | null;
  conductScore: number;
  auditTrail: AuditEntry[];
  currentInstruction: TradeInstruction | null;
  blocked: boolean;
  glitchActive: boolean;
}

export type GameAction =
  | { type: 'RESET' }
  | { type: 'LOGOUT' }
  | {
      type: 'LOAD_PLAYER';
      playerId: string;
      playerName: string;
      rank: Rank;
      careerPnL: number;
      sessionsPlayed: number;
    }
  | { type: 'START_SESSION'; scenarioId: string; startingCash: number }
  | {
      type: 'END_SESSION';
      rank: Rank;
      careerPnL: number;
      sessionsPlayed: number;
    }
  | { type: 'PATCH'; patch: Partial<GameState> };

export interface ScenarioConfig {
  id: string;
  displayName: string;
  ticker: string;
  dateRange: string;
  csvPath: string;
  locked?: boolean;
}

export interface LeaderboardEntry {
  player_name: string;
  rank: Rank;
  career_pnl: number;
}
