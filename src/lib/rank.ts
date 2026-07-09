import type { Rank } from './types';

/** Rank thresholds from build plan Slice 4. */
export function computeRank(pnl: number, conductScore: number): Rank {
  if (pnl > 0 && conductScore >= 90) return 'Desk Head';
  if (pnl > 0 && conductScore >= 70) return 'VP';
  if (pnl >= 0 || conductScore >= 70) return 'Associate';
  return 'Junior Trader';
}
