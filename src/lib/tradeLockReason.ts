import type { TradeInstruction } from './types';

export function describeTradeLockReason(input: {
  hasInstruction: boolean;
  blocked: boolean;
  glitchActive: boolean;
  instruction: TradeInstruction | null;
  tradeUnlocked: boolean;
}): string | null {
  const { hasInstruction, blocked, glitchActive, instruction, tradeUnlocked } =
    input;

  if (!hasInstruction) {
    return 'Talk to your Manager (V) to receive a trade instruction.';
  }
  if (glitchActive) {
    return 'Price feed frozen — resolve with Tech (T) before trading.';
  }
  if (blocked) {
    return 'Compliance block — justify the size in Compliance (C) or ask Manager for a smaller ticket.';
  }
  if (tradeUnlocked && instruction) {
    return `${instruction.action.toUpperCase()} ${instruction.sizePctOfCash}% unlocked — size the ticket and execute.`;
  }
  return 'Order ticket locked.';
}
