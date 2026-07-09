import { PNL_TO_CONDUCT_WEIGHT, RANK_THRESHOLDS } from '../constants';
import type { Rank } from '../types';

export function computeRank(pnl: number, conductScore: number): Rank {
  const score = pnl + conductScore * PNL_TO_CONDUCT_WEIGHT;

  if (score < RANK_THRESHOLDS.ASSOCIATE) return 'Junior Trader';
  if (score < RANK_THRESHOLDS.VP) return 'Associate';
  if (score < RANK_THRESHOLDS.DESK_HEAD) return 'VP';
  return 'Desk Head';
}

export function computeFinalScore(pnl: number, conductScore: number): number {
  return pnl + conductScore * PNL_TO_CONDUCT_WEIGHT;
}
