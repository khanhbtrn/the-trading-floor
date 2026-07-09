'use client';

import { useCallback, useState } from 'react';
import { useGame } from '@/context/GameProvider';
import {
  completeIntro,
  playerIntroCompleted,
  playerRowToRank,
  resumePlayerByName,
} from '@/lib/playerService';

export function usePlayerInit() {
  const { state, dispatch } = useGame();
  const [playerReady, setPlayerReady] = useState(false);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [introCompleted, setIntroCompleted] = useState(true);
  const [introCompleting, setIntroCompleting] = useState(false);
  const [sessionEpoch, setSessionEpoch] = useState(0);

  const loadPlayerRow = useCallback(
    (row: {
      id: string;
      player_name: string;
      rank: string;
      career_pnl: number;
      sessions_played?: number;
      intro_completed?: boolean;
    }) => {
      dispatch({
        type: 'LOAD_PLAYER',
        playerId: row.id,
        playerName: row.player_name,
        rank: playerRowToRank(row.rank),
        careerPnL: Number(row.career_pnl),
        sessionsPlayed: row.sessions_played ?? 0,
      });
      setIntroCompleted(
        row.intro_completed === true || (row.sessions_played ?? 0) > 0
      );
      setPlayerReady(true);
      setPlayerError(null);
    },
    [dispatch]
  );

  const handleEnterName = async (name: string) => {
    setPlayerLoading(true);
    setPlayerError(null);

    const result = await resumePlayerByName(name);
    if (!result.ok) {
      setPlayerError(result.error);
      setPlayerLoading(false);
      return;
    }

    loadPlayerRow(result.data);
    setPlayerLoading(false);
  };

  const finishIntro = useCallback(async () => {
    const playerId = state.playerId;
    if (!playerId) {
      setIntroCompleted(true);
      return;
    }

    setIntroCompleting(true);
    const result = await completeIntro(playerId);
    setIntroCompleting(false);

    if (result.ok) {
      setIntroCompleted(playerIntroCompleted(result.data));
    } else {
      setIntroCompleted(true);
    }
  }, [state.playerId]);

  const handleLogout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
    setPlayerReady(false);
    setIntroCompleted(true);
    setPlayerError(null);
    setSessionEpoch((epoch) => epoch + 1);
  }, [dispatch]);

  return {
    playerReady,
    playerLoading,
    playerError,
    handleEnterName,
    handleLogout,
    needsLogin: !playerReady,
    needsIntro: playerReady && !introCompleted,
    finishIntro,
    introCompleting,
    sessionEpoch,
  };
}
