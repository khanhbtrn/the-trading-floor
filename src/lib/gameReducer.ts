import type { GameAction, GameState } from './types';

export const INITIAL_CONDUCT_SCORE = 100;
export const DEFAULT_STARTING_CASH = 100_000;

export const initialGameState: GameState = {
  scenarioId: null,
  tick: 0,
  price: 0,
  position: { qty: 0, avgPrice: 0 },
  cash: 0,
  pnl: 0,
  conductScore: INITIAL_CONDUCT_SCORE,
  auditTrail: [],
  currentInstruction: null,
  blocked: false,
  glitchActive: false,
  rank: null,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'RESET':
      return initialGameState;

    case 'SET_SCENARIO':
      return {
        ...initialGameState,
        scenarioId: action.scenarioId,
        cash: action.startingCash,
      };

    case 'PATCH':
      return { ...state, ...action.patch };

    default:
      return state;
  }
}
