'use client';

import { PageShell } from '@/components/PageShell';
import { RiskCheck } from '@/components/RiskCheck';
import { RouteGuard } from '@/components/RouteGuard';
import { useGame } from '@/context/GameProvider';

export default function RiskCheckPage() {
  const { state, dispatch } = useGame();

  return (
    <PageShell>
      <RouteGuard requireScenario requireInstruction>
        <RiskCheck
          state={state}
          onContinue={() => dispatch({ type: 'RISK_CHECK_CONTINUE' })}
        />
      </RouteGuard>
    </PageShell>
  );
}
