'use client';

import { Desk } from '@/components/Desk';
import { PageShell } from '@/components/PageShell';
import { RouteGuard } from '@/components/RouteGuard';
import { useGame } from '@/context/GameProvider';

export default function DeskPage() {
  const { state, dispatch } = useGame();

  return (
    <PageShell>
      <RouteGuard requireScenario>
        <Desk
          state={state}
          onAdvanceTick={() => dispatch({ type: 'ADVANCE_TICK' })}
          onTrade={(action, size) =>
            dispatch({ type: 'EXECUTE_TRADE', action, size })
          }
          onResolveGlitch={(note) =>
            dispatch({ type: 'RESOLVE_GLITCH', note })
          }
          onEndSession={() => dispatch({ type: 'END_SESSION' })}
        />
      </RouteGuard>
    </PageShell>
  );
}
