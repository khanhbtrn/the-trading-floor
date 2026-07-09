import type { Rank } from './types';

/**
 * Rank thresholds tuned for the 2008 scenario (~$100k book, ~85 ticks).
 * Promotion paths: career PnL milestones and/or sustained desk tenure.
 */
export function computeRank(
  careerPnL: number,
  conductScore: number,
  sessionsPlayed = 0
): Rank {
  if (
    (careerPnL >= 25_000 && conductScore >= 90) ||
    (sessionsPlayed >= 12 && conductScore >= 85)
  ) {
    return 'Desk Head';
  }
  if (
    (careerPnL >= 10_000 && conductScore >= 80) ||
    (sessionsPlayed >= 6 && conductScore >= 75)
  ) {
    return 'VP';
  }
  if (
    (careerPnL >= 2_500 && conductScore >= 70) ||
    (sessionsPlayed >= 3 && conductScore >= 65)
  ) {
    return 'Associate';
  }
  return 'Junior Trader';
}

export const RANK_ORDER: Record<Rank, number> = {
  'Junior Trader': 0,
  Associate: 1,
  VP: 2,
  'Desk Head': 3,
};
