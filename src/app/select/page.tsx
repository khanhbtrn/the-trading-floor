'use client';

import { PageShell } from '@/components/PageShell';
import { ScenarioSelect } from '@/components/ScenarioSelect';
import { useGame } from '@/context/GameProvider';
import { scenarios } from '@/lib/scenarios';

export default function SelectPage() {
  const { dispatch } = useGame();

  return (
    <PageShell>
      <ScenarioSelect
        scenarios={scenarios}
        onSelect={(scenario) => dispatch({ type: 'SELECT_SCENARIO', scenario })}
      />
    </PageShell>
  );
}
