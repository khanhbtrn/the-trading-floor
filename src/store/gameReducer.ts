import { INITIAL_CONDUCT_SCORE } from '../constants';
import type { GameAction, GameState } from '../types';
import { computeRank } from '../utils/rank';
import {
  classifyTradeAuditType,
  computePnl,
  executeTrade,
} from '../utils/trade';

export const initialGameState: GameState = {
  screen: 'SCENARIO_SELECT',
  scenario: null,
  tick: 0,
  price: 0,
  position: 0,
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
    case 'SELECT_SCENARIO': {
      const scenario = action.scenario;
      const firstPrice = scenario.priceSeries[0]?.price ?? 0;
      return {
        ...initialGameState,
        screen: 'BRIEFING',
        scenario,
        tick: 0,
        price: firstPrice,
        cash: scenario.startingCash,
        pnl: 0,
      };
    }

    case 'BRIEFING_COMPLETE':
      return {
        ...state,
        screen: 'RISK_CHECK',
        currentInstruction: action.instruction,
      };

    case 'RISK_CHECK_CONTINUE': {
      if (!state.currentInstruction || !state.scenario) return state;

      const violations = state.scenario.riskRules.filter((rule) =>
        rule.check(state.currentInstruction!, state)
      );

      if (violations.length === 0) {
        return {
          ...state,
          screen: 'DESK',
          blocked: false,
        };
      }

      return {
        ...state,
        screen: 'ESCALATION',
        blocked: true,
      };
    }

    case 'COMPLIANCE_OVERRIDE':
      return {
        ...state,
        blocked: false,
        screen: 'DESK',
        conductScore: state.conductScore + action.conductDelta,
        auditTrail: [
          ...state.auditTrail,
          {
            tick: state.tick,
            type: 'OVERRIDE',
            action: 'NONE',
            size: 0,
            price: state.price,
            pnlDelta: 0,
            note: action.note,
          },
        ],
      };

    case 'COMPLIANCE_REJECT':
      return {
        ...state,
        blocked: false,
        screen: 'DESK',
        currentInstruction: null,
        auditTrail: [
          ...state.auditTrail,
          {
            tick: state.tick,
            type: 'BLOCKED',
            action: 'NONE',
            size: 0,
            price: state.price,
            pnlDelta: 0,
            note: action.note,
          },
        ],
      };

    case 'ADVANCE_TICK': {
      if (!state.scenario || state.glitchActive) return state;

      const nextTick = state.tick + 1;
      if (nextTick >= state.scenario.priceSeries.length) return state;

      const nextPrice = state.scenario.priceSeries[nextTick].price;
      const newPnl = computePnl(
        state.cash,
        state.position,
        nextPrice,
        state.scenario.startingCash
      );

      const glitchTriggers = nextTick === state.scenario.glitch.triggerTick;

      return {
        ...state,
        tick: nextTick,
        price: nextPrice,
        pnl: newPnl,
        glitchActive: glitchTriggers ? true : state.glitchActive,
      };
    }

    case 'RESOLVE_GLITCH':
      return {
        ...state,
        glitchActive: false,
        auditTrail: [
          ...state.auditTrail,
          {
            tick: state.tick,
            type: 'GLITCH_RELATED',
            action: 'NONE',
            size: 0,
            price: state.price,
            pnlDelta: 0,
            note: action.note,
          },
        ],
      };

    case 'EXECUTE_TRADE': {
      if (state.glitchActive || !state.scenario) return state;

      const result = executeTrade(state, action.action, action.size);
      if (!result) return state;

      const auditType = classifyTradeAuditType(state, action.action, action.size);

      return {
        ...state,
        position: result.position,
        cash: result.cash,
        pnl: result.pnl,
        auditTrail: [
          ...state.auditTrail,
          {
            tick: state.tick,
            type: auditType,
            action: action.action,
            size: action.size,
            price: state.price,
            pnlDelta: result.pnlDelta,
            note:
              auditType === 'AI_INSTRUCTED'
                ? 'Executed per manager instruction'
                : auditType === 'OVERRIDE'
                  ? 'Trade following compliance override'
                  : 'Discretionary trade',
          },
        ],
      };
    }

    case 'END_SESSION':
      return {
        ...state,
        screen: 'SCORECARD',
        rank: computeRank(state.pnl, state.conductScore),
      };

    case 'RESET_GAME':
      return initialGameState;

    default:
      return state;
  }
}
