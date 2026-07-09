import { NextResponse } from 'next/server';
import { runIntroMigration } from '@/lib/runIntroMigration';
import { getSupabaseServer, type PlayerRow } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function findPlayerByName(
  supabase: NonNullable<ReturnType<typeof getSupabaseServer>>,
  playerName: string
): Promise<PlayerRow | null> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .ilike('player_name', playerName);

  if (error || !data?.length) {
    return null;
  }

  const target = playerName.toLowerCase();
  return data.find((row) => row.player_name.toLowerCase() === target) ?? null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get('id')?.trim();

  if (!playerId) {
    return NextResponse.json({ error: 'id query param is required' }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', playerId)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Player not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ player: data });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const playerName =
    typeof body === 'object' && body !== null && 'playerName' in body
      ? String((body as { playerName: unknown }).playerName).trim()
      : '';

  if (!playerName) {
    return NextResponse.json({ error: 'playerName is required' }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const existing = await findPlayerByName(supabase, playerName);
  if (existing) {
    return NextResponse.json({ player: existing });
  }

  const { data, error } = await supabase
    .from('players')
    .insert({ player_name: playerName })
    .select()
    .single();

  if (error || !data) {
    if (error?.code === '23505') {
      const raced = await findPlayerByName(supabase, playerName);
      if (raced) {
        return NextResponse.json({ player: raced });
      }
    }
    console.error('players insert failed:', error?.message);
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create player' },
      { status: 500 }
    );
  }

  return NextResponse.json({ player: data });
}

export async function PATCH(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const playerId =
    typeof body === 'object' && body !== null && 'playerId' in body
      ? String((body as { playerId: unknown }).playerId).trim()
      : '';

  if (!playerId) {
    return NextResponse.json({ error: 'playerId is required' }, { status: 400 });
  }

  const introCompleted =
    typeof body === 'object' &&
    body !== null &&
    'introCompleted' in body &&
    (body as { introCompleted: unknown }).introCompleted === true;

  if (!introCompleted) {
    return NextResponse.json({ error: 'introCompleted: true is required' }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  await runIntroMigration();

  const { data, error } = await supabase
    .from('players')
    .update({
      intro_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', playerId)
    .select()
    .single();

  if (error || !data) {
    console.error('players intro update failed:', error?.message);
    return NextResponse.json(
      { error: error?.message ?? 'Failed to update player' },
      { status: 500 }
    );
  }

  return NextResponse.json({ player: data });
}
