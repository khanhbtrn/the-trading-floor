'use client';

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import { gameReducer, initialGameState } from '@/lib/gameReducer';
import type { GameAction, GameState } from '@/lib/types';

const PLAYER_ID_KEY = 'trading-floor-player-id';
const PLAYER_NAME_KEY = 'trading-floor-player-name';

interface GameContextValue {
  state: GameState;
  dispatch: Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

function loadStoredPlayer(): { playerId: string; playerName: string } {
  if (typeof window === 'undefined') {
    return { playerId: '', playerName: 'Trader' };
  }

  let playerId = localStorage.getItem(PLAYER_ID_KEY) ?? '';
  if (!playerId) {
    playerId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `player-${Date.now()}`;
    localStorage.setItem(PLAYER_ID_KEY, playerId);
  }

  const playerName = localStorage.getItem(PLAYER_NAME_KEY) ?? 'Trader';
  return { playerId, playerName };
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  useEffect(() => {
    const { playerId, playerName } = loadStoredPlayer();
    dispatch({ type: 'INIT_PLAYER', playerId, playerName });
  }, []);

  useEffect(() => {
    if (!state.playerId) return;
    localStorage.setItem(PLAYER_ID_KEY, state.playerId);
  }, [state.playerId]);

  useEffect(() => {
    if (!state.playerName) return;
    localStorage.setItem(PLAYER_NAME_KEY, state.playerName);
  }, [state.playerName]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame must be used within GameProvider');
  }
  return ctx;
}
