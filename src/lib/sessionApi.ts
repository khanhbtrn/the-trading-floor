import type { Rank } from '@/lib/types';

export interface EndSessionPayload {
  playerId: string;
  scenarioId: string;
  sessionPnL: number;
  conductScore: number;
  finalRank: Rank;
  careerPnL: number;
  sessionsPlayed: number;
}

export type SessionEndResult =
  | { ok: true }
  | { ok: false; reason: string };

export type LeaderboardResult =
  | { ok: true; entries: { player_name: string; rank: Rank; career_pnl: number }[] }
  | { ok: false; error: string; entries: [] };

export async function endSession(payload: EndSessionPayload): Promise<SessionEndResult> {
  try {
    const res = await fetch('/api/session/end', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as { ok?: boolean; reason?: string; error?: string };

    if (!res.ok) {
      return { ok: false, reason: data.reason ?? data.error ?? `HTTP ${res.status}` };
    }

    if (data.ok !== true) {
      return { ok: false, reason: data.reason ?? data.error ?? 'Save failed' };
    }

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error ? e.message : 'Network error',
    };
  }
}

export async function fetchLeaderboard(): Promise<LeaderboardResult> {
  try {
    const res = await fetch('/api/leaderboard');
    const data = (await res.json()) as {
      entries?: { player_name: string; rank: Rank; career_pnl: number }[];
      error?: string;
    };

    if (!res.ok) {
      return {
        ok: false,
        error: data.error ?? `Leaderboard failed (${res.status})`,
        entries: [],
      };
    }

    return { ok: true, entries: data.entries ?? [] };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Leaderboard network error',
      entries: [],
    };
  }
}
