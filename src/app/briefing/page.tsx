'use client';

import { PageShell } from '@/components/PageShell';
import { useGame } from '@/context/GameProvider';
import { getScenarioById } from '@/lib/scenarios';

export default function BriefingPage() {
  const { state } = useGame();
  const scenario = state.scenarioId ? getScenarioById(state.scenarioId) : null;

  return (
    <PageShell
      title="MORNING BRIEFING"
      subtitle={scenario ? `${scenario.displayName} — ${scenario.ticker}` : 'No scenario selected'}
    >
      <p className="font-mono text-sm text-zinc-400">
        Manager NPC chat will wire here in Slice 2. Instruction lands in{' '}
        <code className="text-cyan-300">currentInstruction</code>.
      </p>
      <pre className="mt-6 overflow-x-auto rounded border border-zinc-800 bg-black/40 p-4 text-xs text-zinc-400">
        {JSON.stringify(
          { currentInstruction: state.currentInstruction, conductScore: state.conductScore },
          null,
          2
        )}
      </pre>
    </PageShell>
  );
}
