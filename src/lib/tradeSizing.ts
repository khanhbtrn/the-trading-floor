import type { TradeAction, TradeInstruction } from './types';

/** Cash deployed as % of book for a share count at a given price. */
export function instructionCashPct(
  sizeShares: number,
  price: number,
  cash: number
): number {
  if (price <= 0 || cash <= 0 || sizeShares <= 0) return 0;
  return (sizeShares * price / cash) * 100;
}

export function formatInstructionLabel(
  action: TradeAction,
  sizeShares: number
): string {
  const shares = Math.round(sizeShares).toLocaleString('en-US');
  return `${action.toUpperCase()} ${shares} shares`;
}

export type RawInstruction = {
  action: TradeAction;
  sizeShares?: number;
  sizePctOfCash?: number;
  reason: string;
};

/** Normalize manager JSON — accepts share count or legacy % of cash. */
export function resolveInstructionShares(
  raw: RawInstruction,
  price: number,
  cash: number
): TradeInstruction | null {
  const { action, reason } = raw;
  if (action !== 'buy' && action !== 'sell') return null;

  let sizeShares =
    typeof raw.sizeShares === 'number' && Number.isFinite(raw.sizeShares)
      ? Math.floor(raw.sizeShares)
      : 0;

  if (
    sizeShares <= 0 &&
    typeof raw.sizePctOfCash === 'number' &&
    Number.isFinite(raw.sizePctOfCash) &&
    raw.sizePctOfCash > 0 &&
    price > 0 &&
    cash > 0
  ) {
    sizeShares = Math.floor((raw.sizePctOfCash / 100) * cash / price);
  }

  if (sizeShares <= 0) return null;

  return {
    action,
    sizeShares,
    reason: reason?.trim() || 'Desk order',
  };
}

/** Parse buy/sell + share count from manager spoken reply when JSON is missing. */
export function salvageInstructionFromReply(
  reply: string,
  price: number,
  cash: number
): TradeInstruction | null {
  const text = reply.trim();
  if (!text) return null;

  const actionMatch = text.match(/\b(buy|sell)\b/i);
  if (!actionMatch) return null;
  const action = actionMatch[1].toLowerCase() as TradeAction;

  const shareMatch =
    text.match(/(\d[\d,]*)\s*shares?/i) ??
    text.match(/\b(buy|sell)\s+(\d[\d,]*)\b/i);
  const shareRaw = shareMatch
    ? (shareMatch[2] ?? shareMatch[1]).replace(/,/g, '')
    : null;
  let sizeShares = shareRaw ? Number(shareRaw) : 0;

  if ((!sizeShares || !Number.isFinite(sizeShares)) && price > 0 && cash > 0) {
    const pctMatch = text.match(/(\d+(?:\.\d+)?)\s*%/i);
    if (pctMatch) {
      sizeShares = Math.floor((Number(pctMatch[1]) / 100) * cash / price);
    }
  }

  if (!Number.isFinite(sizeShares) || sizeShares <= 0) return null;

  return {
    action,
    sizeShares: Math.floor(sizeShares),
    reason: text.slice(0, 120),
  };
}
