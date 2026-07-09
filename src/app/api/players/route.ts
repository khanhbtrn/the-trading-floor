import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { Rank } from '@/lib/types';

const VALID_RANKS: Rank[] = [
  'Junior Trader',
  'Associate',
  'VP',
  'Desk Head',
];

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { playerId, rank, careerPnL } = body as Record<string, unknown>;

  if (typeof playerId !== 'string' || !playerId.trim()) {
    return NextResponse.json({ error: 'playerId is required' }, { status: 400 });
  }
  if (typeof rank !== 'string' || !VALID_RANKS.includes(rank as Rank)) {
    return NextResponse.json({ error: 'Invalid rank' }, { status: 400 });
  }
  if (typeof careerPnL !== 'number' || !Number.isFinite(careerPnL)) {
    return NextResponse.json({ error: 'careerPnL must be a number' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, persisted: false, reason: 'Supabase not configured' },
      { status: 503 }
    );
  }

  const { error } = await supabase.from('players').upsert(
    {
      id: playerId.trim(),
      rank,
      career_pnl: careerPnL,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.error('Supabase upsert failed:', error.message);
    return NextResponse.json(
      { ok: false, persisted: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, persisted: true });
}
