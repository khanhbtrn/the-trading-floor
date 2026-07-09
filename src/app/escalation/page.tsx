'use client';

import { Escalation } from '@/components/Escalation';
import { PageShell } from '@/components/PageShell';
import { RouteGuard } from '@/components/RouteGuard';
import { useGame } from '@/context/GameProvider';

export default function EscalationPage() {
  const { state, dispatch } = useGame();

  return (
    <PageShell>
      <RouteGuard requireScenario requireBlocked>
        <Escalation
          state={state}
          onOverride={(note, conductDelta) =>
            dispatch({ type: 'COMPLIANCE_OVERRIDE', note, conductDelta })
          }
          onReject={(note) => dispatch({ type: 'COMPLIANCE_REJECT', note })}
        />
      </RouteGuard>
    </PageShell>
  );
}
