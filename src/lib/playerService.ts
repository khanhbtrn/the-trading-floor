import { getSupabaseBrowser, type PlayerRow } from '@/lib/supabase';
import type { Rank } from '@/lib/types';

const PLAYER_ID_KEY = 'trading-floor-player-id';

export type PlayerServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function getStoredPlayerId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PLAYER_ID_KEY);
}

export function storePlayerId(id: string): void {
  localStorage.setItem(PLAYER_ID_KEY, id);
}

export function clearStoredPlayerId(): void {
  localStorage.removeItem(PLAYER_ID_KEY);
}

export async function createPlayer(
  playerName: string
): Promise<PlayerServiceResult<PlayerRow>> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return {
      ok: false,
      error: 'Supabase is not configured (missing NEXT_PUBLIC_SUPABASE_URL or ANON_KEY).',
    };
  }

  const trimmed = playerName.trim();
  if (!trimmed) {
    return { ok: false, error: 'Name is required.' };
  }

  const { data, error } = await supabase
    .from('players')
    .insert({ player_name: trimmed })
    .select()
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? 'Failed to create player profile.',
    };
  }

  storePlayerId(data.id);
  return { ok: true, data: data as PlayerRow };
}

export async function fetchPlayer(
  playerId: string
): Promise<PlayerServiceResult<PlayerRow>> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return {
      ok: false,
      error: 'Supabase is not configured (missing NEXT_PUBLIC_SUPABASE_URL or ANON_KEY).',
    };
  }

  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', playerId)
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? 'Player profile not found.',
    };
  }

  return { ok: true, data: data as PlayerRow };
}

export function playerRowToRank(rank: string): Rank {
  const valid: Rank[] = ['Junior Trader', 'Associate', 'VP', 'Desk Head'];
  return valid.includes(rank as Rank) ? (rank as Rank) : 'Junior Trader';
}
