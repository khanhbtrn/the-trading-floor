import type { AuditEntry, TradeInstruction } from './types';
import {
  clampConduct,
  compliantResizeBonus,
  instructionFailsRisk,
} from './sessionRules';

export type OrderTicketLockReason =
  | 'no-instruction'
  | 'glitch'
  | 'compliance-block'
  | 'wrong-side'
  | 'no-shares'
  | 'no-cash'
  | 'ready';

export interface OrderTicketStatus {
  lockReason: OrderTicketLockReason;
  message: string;
  activeAction: 'buy' | 'sell' | null;
  canBuy: boolean;
  canSell: boolean;
}

export function computeSuggestedShares(
  instruction: TradeInstruction | null,
  cash: number,
  price: number,
  positionQty: number
): number {
  if (!instruction || price <= 0) return 1;

  if (instruction.action === 'sell') {
    const targetValue = (instruction.sizePctOfCash / 100) * cash;
    const byCash = Math.floor(targetValue / price);
    const capped = Math.min(byCash, positionQty);
    return Math.max(1, capped);
  }

  const budget = (instruction.sizePctOfCash / 100) * cash;
  const shares = Math.floor(budget / price);
  return Math.max(1, shares);
}

export function getOrderTicketStatus(input: {
  instruction: TradeInstruction | null;
  blocked: boolean;
  glitchActive: boolean;
  positionQty: number;
  cash: number;
  price: number;
  size: number;
}): OrderTicketStatus {
  const { instruction, blocked, glitchActive, positionQty, cash, price, size } =
    input;

  if (glitchActive) {
    return {
      lockReason: 'glitch',
      message: 'Feed frozen — call Tech to restore the tape.',
      activeAction: null,
      canBuy: false,
      canSell: false,
    };
  }

  if (!instruction) {
    return {
      lockReason: 'no-instruction',
      message: 'No ticket — tell Big Buck Bro your read to get sized.',
      activeAction: null,
      canBuy: false,
      canSell: false,
    };
  }

  if (blocked) {
    return {
      lockReason: 'compliance-block',
      message: 'Risk blocked this ticket — justify it in Compliance.',
      activeAction: instruction.action,
      canBuy: false,
      canSell: false,
    };
  }

  const activeAction = instruction.action;

  if (activeAction === 'buy') {
    const tradeValue = size * price;
    if (price > 0 && tradeValue > cash) {
      return {
        lockReason: 'no-cash',
        message: `Size too large — max ~${Math.floor(cash / price)} shares at this price.`,
        activeAction: 'buy',
        canBuy: false,
        canSell: false,
      };
    }
    return {
      lockReason: 'ready',
      message: `Ticket live — BUY up to ${instruction.sizePctOfCash}% of cash.`,
      activeAction: 'buy',
      canBuy: size > 0,
      canSell: false,
    };
  }

  if (positionQty <= 0) {
    return {
      lockReason: 'no-shares',
      message: 'Nothing to sell — you have no position on the book.',
      activeAction: 'sell',
      canBuy: false,
      canSell: false,
    };
  }

  if (size > positionQty) {
    return {
      lockReason: 'no-shares',
      message: `Max sell size is ${positionQty} shares.`,
      activeAction: 'sell',
      canBuy: false,
      canSell: false,
    };
  }

  return {
    lockReason: 'ready',
    message: `Ticket live — SELL up to ${instruction.sizePctOfCash}% of book.`,
    activeAction: 'sell',
    canBuy: false,
    canSell: size > 0,
  };
}

/** Parse buy/sell + size from manager spoken reply when JSON instruction is missing. */
export function salvageInstructionFromReply(
  reply: string
): TradeInstruction | null {
  const text = reply.trim();
  if (!text) return null;

  const actionMatch = text.match(/\b(buy|sell)\b/i);
  if (!actionMatch) return null;
  const action = actionMatch[1].toLowerCase() as 'buy' | 'sell';

  const pctMatch =
    text.match(/(\d+(?:\.\d+)?)\s*%/i) ??
    text.match(/(?:size|sized?|up)\s*(?:to\s*)?(\d+(?:\.\d+)?)/i);
  const sizePctOfCash = pctMatch ? Number(pctMatch[1]) : 25;
  if (!Number.isFinite(sizePctOfCash) || sizePctOfCash <= 0) return null;

  return {
    action,
    sizePctOfCash,
    reason: text.slice(0, 120),
  };
}

export function instructionStatePatch(
  instruction: TradeInstruction,
  auditTrail: AuditEntry[],
  conductScore: number
): {
  patch: {
    currentInstruction: TradeInstruction;
    blocked: boolean;
    conductScore: number;
  };
  riskStatus: string;
  notifyCompliance: boolean;
} {
  if (instructionFailsRisk(instruction)) {
    return {
      patch: {
        currentInstruction: instruction,
        blocked: true,
        conductScore,
      },
      riskStatus: 'BLOCKED — see Compliance',
      notifyCompliance: true,
    };
  }

  const bonus = compliantResizeBonus(auditTrail, instruction);
  return {
    patch: {
      currentInstruction: instruction,
      blocked: false,
      conductScore: clampConduct(conductScore + bonus),
    },
    riskStatus:
      bonus > 0
        ? 'PASS — compliant resize (+10 conduct)'
        : 'PASS — execute on desk',
    notifyCompliance: false,
  };
}
