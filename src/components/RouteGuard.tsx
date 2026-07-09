'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/context/GameProvider';

interface RouteGuardProps {
  children: ReactNode;
  requireScenario?: boolean;
  requireBlocked?: boolean;
  requireInstruction?: boolean;
}

export function RouteGuard({
  children,
  requireScenario = false,
  requireBlocked = false,
  requireInstruction = false,
}: RouteGuardProps) {
  const { state } = useGame();
  const router = useRouter();

  useEffect(() => {
    if (requireScenario && !state.scenario) {
      router.replace('/select');
      return;
    }
    if (requireBlocked && !state.blocked) {
      router.replace(state.scenario ? '/desk' : '/select');
      return;
    }
    if (requireInstruction && !state.currentInstruction) {
      router.replace(state.scenario ? '/briefing' : '/select');
    }
  }, [
    requireScenario,
    requireBlocked,
    requireInstruction,
    state.scenario,
    state.blocked,
    state.currentInstruction,
    router,
  ]);

  if (requireScenario && !state.scenario) return null;
  if (requireBlocked && !state.blocked) return null;
  if (requireInstruction && !state.currentInstruction) return null;

  return <>{children}</>;
}
