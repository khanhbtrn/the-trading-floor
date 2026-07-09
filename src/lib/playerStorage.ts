const PLAYER_ID_KEY = 'trading-floor-player-id';

export function getStoredPlayerId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const id = localStorage.getItem(PLAYER_ID_KEY)?.trim();
    return id || null;
  } catch {
    return null;
  }
}

export function setStoredPlayerId(playerId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PLAYER_ID_KEY, playerId.trim());
  } catch {
    // ignore quota / private mode
  }
}

export function clearStoredPlayerId(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PLAYER_ID_KEY);
  } catch {
    // ignore
  }
}
