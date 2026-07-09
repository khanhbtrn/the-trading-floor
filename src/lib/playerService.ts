import { getSupabaseBrowser, type PlayerRow } from '@/lib/supabase';
import type { Rank } from '@/lib/types';

const PLAYER_ID_KEY = 'trading-floor-player-id';

export function getStoredPlayerId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PLAYER_ID_KEY);
}

export function storePlayerId(id: string): void {
  localStorage.setItem(PLAYER_ID_KEY, id);
}

export async function createPlayer(
  playerName: string
): Promise<PlayerRow | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('players')
    .insert({ player_name: playerName.trim() })
    .select()
    .single();

  if (error || !data) {
    console.error('createPlayer failed:', error?.message);
    return null;
  }

  storePlayerId(data.id);
  return data as PlayerRow;
}

export async function fetchPlayer(playerId: string): Promise<PlayerRow | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', playerId)
    .single();

  if (error || !data) {
    console.error('fetchPlayer failed:', error?.message);
    return null;
  }

  return data as PlayerRow;
}

export function playerRowToRank(rank: string): Rank {
  const valid: Rank[] = ['Junior Trader', 'Associate', 'VP', 'Desk Head'];
  return valid.includes(rank as Rank) ? (rank as Rank) : 'Junior Trader';
}
