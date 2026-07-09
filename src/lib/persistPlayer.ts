import type { Rank } from '@/lib/types';

export async function persistPlayerSession(
  playerId: string,
  rank: Rank,
  careerPnL: number
): Promise<{ persisted: boolean; reason?: string }> {
  try {
    const res = await fetch('/api/players', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ playerId, rank, careerPnL }),
    });

    const data = (await res.json()) as {
      persisted?: boolean;
      reason?: string;
      error?: string;
    };

    if (!res.ok) {
      return {
        persisted: false,
        reason: data.reason ?? data.error ?? `HTTP ${res.status}`,
      };
    }

    return { persisted: data.persisted === true };
  } catch (e) {
    return {
      persisted: false,
      reason: e instanceof Error ? e.message : 'Network error',
    };
  }
}
