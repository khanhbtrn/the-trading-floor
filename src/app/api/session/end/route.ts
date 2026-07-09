import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import type { Rank } from '@/lib/types';

export const dynamic = 'force-dynamic';

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

  const {
    playerId,
    scenarioId,
    sessionPnL,
    conductScore,
    finalRank,
    careerPnL,
    sessionsPlayed,
  } = body as Record<string, unknown>;

  if (typeof playerId !== 'string' || !playerId.trim()) {
    return NextResponse.json({ error: 'playerId is required' }, { status: 400 });
  }
  if (typeof scenarioId !== 'string' || !scenarioId.trim()) {
    return NextResponse.json({ error: 'scenarioId is required' }, { status: 400 });
  }
  if (typeof sessionPnL !== 'number' || !Number.isFinite(sessionPnL)) {
    return NextResponse.json({ error: 'sessionPnL must be a number' }, { status: 400 });
  }
  if (typeof conductScore !== 'number' || !Number.isFinite(conductScore)) {
    return NextResponse.json({ error: 'conductScore must be a number' }, { status: 400 });
  }
  if (typeof finalRank !== 'string' || !VALID_RANKS.includes(finalRank as Rank)) {
    return NextResponse.json({ error: 'Invalid finalRank' }, { status: 400 });
  }
  if (typeof careerPnL !== 'number' || !Number.isFinite(careerPnL)) {
    return NextResponse.json({ error: 'careerPnL must be a number' }, { status: 400 });
  }
  if (typeof sessionsPlayed !== 'number' || !Number.isFinite(sessionsPlayed)) {
    return NextResponse.json({ error: 'sessionsPlayed must be a number' }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, reason: 'Supabase not configured' },
      { status: 503 }
    );
  }

  const { error: gameError } = await supabase.from('games').insert({
    player_id: playerId.trim(),
    scenario_id: scenarioId.trim(),
    session_pnl: sessionPnL,
    conduct_score: conductScore,
    final_rank: finalRank,
  });

  if (gameError) {
    console.error('games insert failed:', gameError.message);
    return NextResponse.json({ ok: false, error: gameError.message }, { status: 500 });
  }

  const { error: playerError } = await supabase
    .from('players')
    .update({
      rank: finalRank,
      career_pnl: careerPnL,
      sessions_played: sessionsPlayed,
      intro_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', playerId.trim());

  if (playerError) {
    console.error('players update failed:', playerError.message);
    return NextResponse.json({ ok: false, error: playerError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
