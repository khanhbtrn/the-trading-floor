export type Screen =
  | 'SCENARIO_SELECT'
  | 'BRIEFING'
  | 'RISK_CHECK'
  | 'ESCALATION'
  | 'DESK'
  | 'SCORECARD';

export type AuditType =
  | 'AI_INSTRUCTED'
  | 'OVERRIDE'
  | 'DISCRETIONARY'
  | 'BLOCKED'
  | 'GLITCH_RELATED';

export type TradeAction = 'BUY' | 'SELL' | 'HOLD' | 'NONE';

export type Rank = 'Junior Trader' | 'Associate' | 'VP' | 'Desk Head';

export interface Instruction {
  id: string;
  text: string;
  action: 'BUY' | 'SELL';
  targetSize: number;
  ticker: string;
  riskFlags: string[];
}

export interface AuditEntry {
  tick: number;
  type: AuditType;
  action: TradeAction;
  size: number;
  price: number;
  pnlDelta: number;
  note: string;
}

export interface PricePoint {
  tick: number;
  date: string;
  price: number;
}

export interface RiskRule {
  id: string;
  description: string;
  check: (instr: Instruction, state: GameState) => boolean;
}

export interface GlitchConfig {
  triggerTick: number;
  description: string;
}

export interface ScriptChoice {
  id: string;
  label: string;
  nextNodeId?: string;
  outcome?: 'override' | 'reject' | 'resolve';
  justification?: string;
}

export interface NpcScriptNode {
  id: string;
  speaker: string;
  text: string;
  choices?: ScriptChoice[];
  instruction?: Instruction;
  isTerminal?: boolean;
}

export interface ScenarioConfig {
  id: string;
  name: string;
  dateRange: string;
  flavorText: string;
  ticker: string;
  startingCash: number;
  priceSeries: PricePoint[];
  briefingScript: NpcScriptNode[];
  riskRules: RiskRule[];
  complianceScript: NpcScriptNode[];
  glitch: GlitchConfig;
  techScript: NpcScriptNode[];
}

export interface GameState {
  screen: Screen;
  scenario: ScenarioConfig | null;
  tick: number;
  price: number;
  position: number;
  cash: number;
  pnl: number;
  conductScore: number;
  auditTrail: AuditEntry[];
  currentInstruction: Instruction | null;
  blocked: boolean;
  glitchActive: boolean;
  rank: Rank | null;
}

export type GameAction =
  | { type: 'SELECT_SCENARIO'; scenario: ScenarioConfig }
  | { type: 'BRIEFING_COMPLETE'; instruction: Instruction }
  | { type: 'RISK_CHECK_CONTINUE' }
  | { type: 'COMPLIANCE_OVERRIDE'; note: string; conductDelta: number }
  | { type: 'COMPLIANCE_REJECT'; note: string }
  | { type: 'ADVANCE_TICK' }
  | { type: 'TRIGGER_GLITCH' }
  | { type: 'RESOLVE_GLITCH'; note: string }
  | { type: 'EXECUTE_TRADE'; action: 'BUY' | 'SELL'; size: number }
  | { type: 'END_SESSION' }
  | { type: 'RESET_GAME' };
