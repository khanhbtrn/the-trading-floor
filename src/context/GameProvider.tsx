'use client';

import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import { gameReducer, initialGameState } from '@/lib/gameReducer';
import type { GameAction, GameState } from '@/lib/types';

interface GameContextValue {
  state: GameState;
  dispatch: Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

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
