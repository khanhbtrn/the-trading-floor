import { POSITION_SIZE_LIMIT, RESTRICTED_TICKERS } from '../constants';
import type { GameState, Instruction, RiskRule } from '../types';

export const positionSizeLimitRule: RiskRule = {
  id: 'position-size-limit',
  description: `Position limit exceeded: instruction exceeds ${POSITION_SIZE_LIMIT.toLocaleString()} share limit`,
  check: (instr: Instruction) => instr.targetSize > POSITION_SIZE_LIMIT,
};

export const restrictedListRule: RiskRule = {
  id: 'restricted-list',
  description: 'Restricted list violation: ticker is on the firm restricted list',
  check: (instr: Instruction) => RESTRICTED_TICKERS.includes(instr.ticker),
};

export const shortOnDownDayRule: RiskRule = {
  id: 'short-down-day',
  description:
    'Short-selling restriction: cannot initiate short position on a down day',
  check: (instr: Instruction, state: GameState) => {
    if (instr.action !== 'SELL' || state.position > 0) return false;
    if (!state.scenario) return false;
    const series = state.scenario.priceSeries;
    const currentIdx = state.tick;
    if (currentIdx < 1) return false;
    const prevPrice = series[currentIdx - 1]?.price ?? state.price;
    const isDownDay = state.price < prevPrice;
    const wouldShort = state.position === 0 || state.position - instr.targetSize < 0;
    return isDownDay && wouldShort && instr.action === 'SELL';
  },
};

export const defaultRiskRules: RiskRule[] = [
  positionSizeLimitRule,
  restrictedListRule,
  shortOnDownDayRule,
];
