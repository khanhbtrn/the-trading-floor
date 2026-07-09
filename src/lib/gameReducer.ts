import type { GameAction, GameState } from './types';

export const INITIAL_CONDUCT_SCORE = 100;
export const DEFAULT_STARTING_CASH = 100_000;
export const MAX_POSITION_PCT_OF_CASH = 50;
export const GLITCH_TICK = 20;
export const SHOCK_TICK = 12;
/** Biggest single-tick down-move ratio from the 2008 scenario CSV (tick 31). */
export const SHOCK_DROP_RATIO = 90.0199966430664 / 99.8499984741211;
export const ORDER_COUNTDOWN_SEC = 15;

export const initialGameState: GameState = {
  playerId: '',
  playerName: '',
  rank: 'Junior Trader',
  careerPnL: 0,
  sessionsPlayed: 0,
  sessionPnL: 0,
  position: { qty: 0, avgPrice: 0 },
  cash: 0,
  pnl: 0,
  currentScenarioId: null,
  conductScore: INITIAL_CONDUCT_SCORE,
  auditTrail: [],
  currentInstruction: null,
  blocked: false,
  glitchActive: false,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'RESET':
      return {
        ...initialGameState,
        playerId: state.playerId,
        playerName: state.playerName,
        rank: state.rank,
        careerPnL: state.careerPnL,
        sessionsPlayed: state.sessionsPlayed,
      };

    case 'LOGOUT':
      return { ...initialGameState };

    case 'LOAD_PLAYER':
      return {
        ...state,
        playerId: action.playerId,
        playerName: action.playerName,
        rank: action.rank,
        careerPnL: action.careerPnL,
        sessionsPlayed: action.sessionsPlayed,
      };

    case 'START_SESSION':
      return {
        ...state,
        currentScenarioId: action.scenarioId,
        sessionPnL: 0,
        position: { qty: 0, avgPrice: 0 },
        cash: action.startingCash,
        pnl: 0,
        conductScore: INITIAL_CONDUCT_SCORE,
        auditTrail: [],
        currentInstruction: null,
        blocked: false,
        glitchActive: false,
      };

    case 'END_SESSION':
      return {
        ...state,
        sessionPnL: 0,
        rank: action.rank,
        careerPnL: action.careerPnL,
        sessionsPlayed: action.sessionsPlayed,
        currentScenarioId: null,
        position: { qty: 0, avgPrice: 0 },
        cash: 0,
        pnl: 0,
        conductScore: INITIAL_CONDUCT_SCORE,
        auditTrail: [],
        currentInstruction: null,
        blocked: false,
        glitchActive: false,
      };

    case 'PATCH':
      return { ...state, ...action.patch };

    default:
      return state;
  }
}
