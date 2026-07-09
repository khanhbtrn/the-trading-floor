import { INSTRUCTION_SIZE_TOLERANCE } from '../constants';
import type { AuditEntry, AuditType, GameState, Instruction } from '../types';

export function instructionMatches(
  instruction: Instruction,
  action: 'BUY' | 'SELL',
  size: number,
  ticker: string
): boolean {
  if (instruction.ticker !== ticker) return false;
  if (instruction.action !== action) return false;
  const tolerance = Math.max(instruction.targetSize * INSTRUCTION_SIZE_TOLERANCE, 1);
  return Math.abs(size - instruction.targetSize) <= tolerance;
}

export function hasComplianceOverride(auditTrail: AuditEntry[]): boolean {
  return auditTrail.some((e) => e.type === 'OVERRIDE');
}

export function classifyTradeAuditType(
  state: GameState,
  action: 'BUY' | 'SELL',
  size: number
): AuditType {
  const { currentInstruction, scenario, auditTrail } = state;
  if (!scenario) return 'DISCRETIONARY';

  if (
    currentInstruction &&
    instructionMatches(
      currentInstruction,
      action,
      size,
      scenario.ticker
    )
  ) {
    return 'AI_INSTRUCTED';
  }

  if (hasComplianceOverride(auditTrail)) {
    return 'OVERRIDE';
  }

  return 'DISCRETIONARY';
}

export function computePnl(
  cash: number,
  position: number,
  price: number,
  startingCash: number
): number {
  return cash + position * price - startingCash;
}

export function executeTrade(
  state: GameState,
  action: 'BUY' | 'SELL',
  size: number
): { position: number; cash: number; pnl: number; pnlDelta: number } | null {
  if (!state.scenario || size <= 0 || !Number.isFinite(size)) return null;

  const { price, position, cash, scenario } = state;
  const startingCash = scenario.startingCash;
  const prevPnl = computePnl(cash, position, price, startingCash);
  const tradeValue = size * price;

  let newPosition = position;
  let newCash = cash;

  if (action === 'BUY') {
    if (tradeValue > cash + 0.001) return null;
    newPosition = position + size;
    newCash = cash - tradeValue;
  } else {
    if (size > position + 0.001 || position <= 0) return null;
    newPosition = position - size;
    newCash = cash + tradeValue;
  }

  const newPnl = computePnl(newCash, newPosition, price, startingCash);

  return {
    position: newPosition,
    cash: newCash,
    pnl: newPnl,
    pnlDelta: newPnl - prevPnl,
  };
}
