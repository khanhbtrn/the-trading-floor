import type { GameAction, GameState } from './types';

export const INITIAL_CONDUCT_SCORE = 100;
export const DEFAULT_STARTING_CASH = 100_000;

function createPlayerId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `player-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const initialGameState: GameState = {
  playerId: '',
  playerName: 'Trader',
  rank: 'Junior Trader',
  careerPnL: 0,
  sessionPnL: 0,
  position: { qty: 0, avgPrice: 0 },
  cash: 0,
  pnl: 0,
  currentScenarioId: null,
  conductScore: INITIAL_CONDUCT_SCORE,
  auditTrail: [],
  glitchActive: false,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'RESET':
      return {
        ...initialGameState,
        playerId: state.playerId || createPlayerId(),
        playerName: state.playerName,
        rank: state.rank,
        careerPnL: state.careerPnL,
      };

    case 'INIT_PLAYER':
      return {
        ...state,
        playerId: action.playerId,
        playerName: action.playerName,
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
        glitchActive: false,
      };

    case 'END_SESSION':
      return {
        ...state,
        sessionPnL: 0,
        rank: action.rank,
        careerPnL: action.careerPnL,
        currentScenarioId: null,
        position: { qty: 0, avgPrice: 0 },
        cash: 0,
        pnl: 0,
        conductScore: INITIAL_CONDUCT_SCORE,
        auditTrail: [],
        glitchActive: false,
      };

    case 'PATCH':
      return { ...state, ...action.patch };

    default:
      return state;
  }
}
