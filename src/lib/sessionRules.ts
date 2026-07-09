import type { AuditEntry, TradeInstruction } from './types';
import { MAX_POSITION_PCT_OF_CASH } from './gameReducer';

export const CONDUCT_OVERRIDE_PENALTY = 20;
export const CONDUCT_COMPLIANT_RESIZE_BONUS = 10;
export const CONDUCT_GLITCH_PANIC_PENALTY = 10;
export const CONDUCT_ORDER_EXPIRED = -5;

export const MANAGER_NUDGE_LINES = [
  'well?',
  'still waiting.',
  "this isn't a discussion",
] as const;

export function instructionFailsRisk(instruction: TradeInstruction): boolean {
  return instruction.sizePctOfCash > MAX_POSITION_PCT_OF_CASH;
}

export function hadComplianceRejection(auditTrail: AuditEntry[]): boolean {
  return auditTrail.some((e) => e.source === 'blocked');
}

/** +10 when player secures a compliant instruction after a compliance rejection. */
export function compliantResizeBonus(
  auditTrail: AuditEntry[],
  instruction: TradeInstruction
): number {
  if (instructionFailsRisk(instruction)) return 0;
  return hadComplianceRejection(auditTrail) ? CONDUCT_COMPLIANT_RESIZE_BONUS : 0;
}

export function clampConduct(score: number): number {
  return Math.max(0, Math.min(100, score));
}
