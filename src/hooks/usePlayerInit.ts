'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from '@/context/GameProvider';
import {
  clearStoredPlayerId,
  createPlayer,
  fetchPlayer,
  getStoredPlayerId,
  playerRowToRank,
} from '@/lib/playerService';

export function usePlayerInit() {
  const { dispatch } = useGame();
  const [playerReady, setPlayerReady] = useState(false);
  const [playerLoading, setPlayerLoading] = useState(true);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const hadStoredId = useRef(false);

  useEffect(() => {
    hadStoredId.current = !!getStoredPlayerId();
  }, []);

  const loadPlayerRow = useCallback(
    (row: {
      id: string;
      player_name: string;
      rank: string;
      career_pnl: number;
      sessions_played?: number;
    }) => {
      dispatch({
        type: 'LOAD_PLAYER',
        playerId: row.id,
        playerName: row.player_name,
        rank: playerRowToRank(row.rank),
        careerPnL: Number(row.career_pnl),
        sessionsPlayed: row.sessions_played ?? 0,
      });
      setPlayerReady(true);
      setPlayerError(null);
    },
    [dispatch]
  );

  const hydratePlayer = useCallback(async () => {
    setPlayerLoading(true);
    setPlayerError(null);

    const storedId = getStoredPlayerId();
    if (!storedId) {
      setPlayerLoading(false);
      return;
    }

    const result = await fetchPlayer(storedId);
    if (!result.ok) {
      clearStoredPlayerId();
      setPlayerError(result.error);
      setPlayerLoading(false);
      return;
    }

    loadPlayerRow(result.data);
    setPlayerLoading(false);
  }, [loadPlayerRow]);

  useEffect(() => {
    void hydratePlayer();
  }, [hydratePlayer]);

  const handleCreatePlayer = async (name: string) => {
    setPlayerLoading(true);
    setPlayerError(null);

    const result = await createPlayer(name);
    if (!result.ok) {
      setPlayerError(result.error);
      setPlayerLoading(false);
      return;
    }

    loadPlayerRow(result.data);
    setPlayerLoading(false);
  };

  return {
    playerReady,
    playerLoading,
    playerError,
    handleCreatePlayer,
    needsLogin: !playerReady && !playerLoading,
    isBooting: playerLoading && hadStoredId.current && !playerReady,
  };
}
