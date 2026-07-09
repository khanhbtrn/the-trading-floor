import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

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

  const { data, error } = await supabase
    .from('players')
    .insert({ player_name: playerName })
    .select()
    .single();

  if (error || !data) {
    console.error('players insert failed:', error?.message);
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create player' },
      { status: 500 }
    );
  }

  return NextResponse.json({ player: data });
}
