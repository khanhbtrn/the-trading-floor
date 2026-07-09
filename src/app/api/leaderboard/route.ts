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

  const entries = sorted.slice(0, 5).map((row) => ({
    player_name: row.player_name,
    rank: toRank(row.rank),
    career_pnl: Number(row.career_pnl),
  }));

  return NextResponse.json({ entries });
}
