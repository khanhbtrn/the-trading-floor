'use client';

import Link from 'next/link';
import { PageShell } from '@/components/PageShell';
import { useGame } from '@/context/GameProvider';
import { DEFAULT_STARTING_CASH } from '@/lib/gameReducer';
import { scenarios } from '@/lib/scenarios';

export default function SelectPage() {
  const { dispatch } = useGame();

  return (
    <PageShell
      title="SCENARIO SELECT"
      subtitle="Choose a historical crisis to trade through"
    >
      <ul className="space-y-4">
        {scenarios.map((scenario) => (
          <li key={scenario.id}>
            <button
              type="button"
              className="w-full rounded border border-cyan-800/50 bg-zinc-900/60 p-5 text-left transition hover:border-cyan-500/60 hover:bg-zinc-900"
              onClick={() => {
                dispatch({
                  type: 'SET_SCENARIO',
                  scenarioId: scenario.id,
                  startingCash: DEFAULT_STARTING_CASH,
                });
              }}
            >
              <p className="font-pixel text-[10px] text-cyan-300">
                {scenario.displayName}
              </p>
              <p className="mt-2 font-mono text-sm text-zinc-300">
                {scenario.ticker} — {scenario.dateRange}
              </p>
              <p className="mt-1 font-mono text-xs text-zinc-500">
                {scenario.csvPath}
              </p>
            </button>
            <Link
              href="/briefing"
              className="mt-2 inline-block font-mono text-xs text-cyan-400 underline"
            >
              Continue to briefing →
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
