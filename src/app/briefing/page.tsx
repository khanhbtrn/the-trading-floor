'use client';

import { Briefing } from '@/components/Briefing';
import { PageShell } from '@/components/PageShell';
import { RouteGuard } from '@/components/RouteGuard';
import { useGame } from '@/context/GameProvider';

export default function BriefingPage() {
  const { state, dispatch } = useGame();

  return (
    <PageShell>
      <RouteGuard requireScenario>
        <Briefing
          state={state}
          onComplete={(instruction) =>
            dispatch({ type: 'BRIEFING_COMPLETE', instruction })
          }
        />
      </RouteGuard>
    </PageShell>
  );
}
