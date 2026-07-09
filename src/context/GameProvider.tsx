'use client';

import {
  createContext,
  useCallback,
  useContext,
  useReducer,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { gameReducer, initialGameState } from '@/lib/store/gameReducer';
import { pathForScreen, shouldNavigateAfterAction } from '@/lib/routes';
import type { GameAction, GameState } from '@/lib/types';

interface GameContextValue {
  state: GameState;
  dispatch: (action: GameAction) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, baseDispatch] = useReducer(gameReducer, initialGameState);
  const router = useRouter();

  const dispatch = useCallback(
    (action: GameAction) => {
      const nextState = gameReducer(state, action);
      baseDispatch(action);

      if (shouldNavigateAfterAction(action.type)) {
        router.push(pathForScreen(nextState.screen));
      }
    },
    [state, router]
  );

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
