import type { PlayerRow } from '@/lib/supabase';
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
  const trimmed = playerName.trim();
  if (!trimmed) {
    return { ok: false, error: 'Name is required.' };
  }

  try {
    const res = await fetch('/api/players', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ playerName: trimmed }),
    });

    const data = (await res.json()) as { player?: PlayerRow; error?: string };

    if (!res.ok) {
      return { ok: false, error: data.error ?? `Create failed (${res.status})` };
    }

    if (!data.player) {
      return { ok: false, error: 'No player returned from server.' };
    }

    storePlayerId(data.player.id);
    return { ok: true, data: data.player };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Network error',
    };
  }
}

export async function fetchPlayer(
  playerId: string
): Promise<PlayerServiceResult<PlayerRow>> {
  try {
    const res = await fetch(
      `/api/players?id=${encodeURIComponent(playerId.trim())}`
    );

    const data = (await res.json()) as { player?: PlayerRow; error?: string };

    if (!res.ok) {
      return { ok: false, error: data.error ?? `Fetch failed (${res.status})` };
    }

    if (!data.player) {
      return { ok: false, error: 'Player profile not found.' };
    }

    return { ok: true, data: data.player };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Network error',
    };
  }
}

export function playerRowToRank(rank: string): Rank {
  const valid: Rank[] = ['Junior Trader', 'Associate', 'VP', 'Desk Head'];
  return valid.includes(rank as Rank) ? (rank as Rank) : 'Junior Trader';
}

export function playerIntroCompleted(row: PlayerRow): boolean {
  if (row.intro_completed === true) return true;
  return (row.sessions_played ?? 0) > 0;
}

export async function completeIntro(
  playerId: string
): Promise<PlayerServiceResult<PlayerRow>> {
  try {
    const res = await fetch('/api/players', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ playerId, introCompleted: true }),
    });

    const data = (await res.json()) as { player?: PlayerRow; error?: string };

    if (!res.ok) {
      return { ok: false, error: data.error ?? `Update failed (${res.status})` };
    }

    if (!data.player) {
      return { ok: false, error: 'No player returned from server.' };
    }

    return { ok: true, data: data.player };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Network error',
    };
  }
}
