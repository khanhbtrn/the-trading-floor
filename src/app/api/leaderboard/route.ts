import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { RANK_ORDER } from '@/lib/rank';
import type { Rank } from '@/lib/types';

export const dynamic = 'force-dynamic';

function toRank(value: string): Rank {
  const valid: Rank[] = ['Junior Trader', 'Associate', 'VP', 'Desk Head'];
  return valid.includes(value as Rank) ? (value as Rank) : 'Junior Trader';
}

export async function GET() {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ entries: [] });
  }

  const { data, error } = await supabase
    .from('players')
    .select('player_name, rank, career_pnl')
    .order('career_pnl', { ascending: false })
    .limit(50);

  if (error || !data) {
    console.error('leaderboard fetch failed:', error?.message);
    return NextResponse.json(
      { entries: [], error: error?.message ?? 'Leaderboard fetch failed' },
      { status: 500 }
    );
  }

  const sorted = [...data].sort((a, b) => {
    const rankDiff =
      RANK_ORDER[toRank(b.rank)] - RANK_ORDER[toRank(a.rank)];
    if (rankDiff !== 0) return rankDiff;
    return Number(b.career_pnl) - Number(a.career_pnl);
  });

  const bestByName = new Map<
    string,
    { player_name: string; rank: Rank; career_pnl: number }
  >();
  for (const row of sorted) {
    const key = row.player_name.trim().toLowerCase();
    const existing = bestByName.get(key);
    const pnl = Number(row.career_pnl);
    if (
      !existing ||
      pnl > existing.career_pnl ||
      (pnl === existing.career_pnl &&
        RANK_ORDER[toRank(row.rank)] > RANK_ORDER[existing.rank])
    ) {
      bestByName.set(key, {
        player_name: row.player_name,
        rank: toRank(row.rank),
        career_pnl: pnl,
      });
    }
  }

  const entries = Array.from(bestByName.values())
    .sort((a, b) => {
      const rankDiff = RANK_ORDER[b.rank] - RANK_ORDER[a.rank];
      if (rankDiff !== 0) return rankDiff;
      return b.career_pnl - a.career_pnl;
    })
    .slice(0, 5);

  return NextResponse.json({ entries });
}
