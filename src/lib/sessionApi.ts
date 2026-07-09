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

export async function endSession(
  payload: EndSessionPayload
): Promise<{ ok: boolean; reason?: string }> {
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

    return { ok: data.ok === true };
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error ? e.message : 'Network error',
    };
  }
}

export async function fetchLeaderboard(): Promise<
  { player_name: string; rank: Rank; career_pnl: number }[]
> {
  try {
    const res = await fetch('/api/leaderboard');
    if (!res.ok) return [];
    const data = (await res.json()) as {
      entries?: { player_name: string; rank: Rank; career_pnl: number }[];
    };
    return data.entries ?? [];
  } catch {
    return [];
  }
}
