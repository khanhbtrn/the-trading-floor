'use client';

import { PageShell } from '@/components/PageShell';
import { RouteGuard } from '@/components/RouteGuard';
import { Scorecard } from '@/components/Scorecard';
import { useGame } from '@/context/GameProvider';

export default function ScorecardPage() {
  const { state, dispatch } = useGame();

  return (
    <PageShell>
      <RouteGuard requireScenario>
        <Scorecard
          state={state}
          onReset={() => dispatch({ type: 'RESET_GAME' })}
        />
      </RouteGuard>
    </PageShell>
  );
}
