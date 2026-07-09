import type { Rank } from './types';

/** Rank thresholds — evaluated against career PnL + conduct at session end. */
export function computeRank(careerPnL: number, conductScore: number): Rank {
  if (careerPnL > 0 && conductScore >= 90) return 'Desk Head';
  if (careerPnL > 0 && conductScore >= 70) return 'VP';
  if (careerPnL >= 0 || conductScore >= 70) return 'Associate';
  return 'Junior Trader';
}

export const RANK_ORDER: Record<Rank, number> = {
  'Junior Trader': 0,
  Associate: 1,
  VP: 2,
  'Desk Head': 3,
};
