import type { TradeAction } from './types';

/** Convert instruction % of cash into whole shares to buy. */
export function pctToBuyShares(
  sizePctOfCash: number,
  cash: number,
  price: number
): number {
  if (price <= 0 || cash <= 0 || sizePctOfCash <= 0) return 0;
  const budget = (sizePctOfCash / 100) * cash;
  return Math.floor(budget / price);
}

/** Convert instruction % of cash into whole shares to sell (capped at position). */
export function pctToSellShares(
  sizePctOfCash: number,
  cash: number,
  price: number,
  positionQty: number
): number {
  if (price <= 0 || positionQty <= 0 || sizePctOfCash <= 0) return 0;
  const targetValue = (sizePctOfCash / 100) * cash;
  const shares = Math.floor(targetValue / price);
  return Math.min(positionQty, Math.max(0, shares));
}

export function formatInstructionLabel(
  action: TradeAction,
  sizePctOfCash: number
): string {
  return `${action.toUpperCase()} ${sizePctOfCash}% of cash`;
}

export function formatSharesPreview(
  action: TradeAction,
  sizePctOfCash: number,
  cash: number,
  price: number,
  positionQty: number
): string | null {
  if (price <= 0) return null;
  const shares =
    action === 'buy'
      ? pctToBuyShares(sizePctOfCash, cash, price)
      : pctToSellShares(sizePctOfCash, cash, price, positionQty);
  if (shares <= 0) return '0 shares at last';
  return `≈ ${shares.toLocaleString('en-US')} shares @ last`;
}
