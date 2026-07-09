import type { TradeInstruction } from './types';

/** Convert manager % of cash into a whole-share ticket size at the current price. */
export function instructionToShareSize(
  instruction: TradeInstruction,
  cash: number,
  price: number
): number {
  if (price <= 0 || cash <= 0 || instruction.sizePctOfCash <= 0) return 0;

  const targetValue = cash * (instruction.sizePctOfCash / 100);
  const shares = Math.floor(targetValue / price);
  if (shares <= 0) return 1;

  if (instruction.action === 'buy') {
    const maxAffordable = Math.floor(cash / price);
    return Math.min(shares, Math.max(maxAffordable, 0));
  }

  return shares;
}
