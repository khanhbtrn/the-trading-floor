'use client';

import { PageShell } from '@/components/PageShell';
import { useGame } from '@/context/GameProvider';

export default function ScorecardPage() {
  const { state } = useGame();

  return (
    <PageShell
      title="SCORECARD"
      subtitle="Session results and audit trail"
    >
      <div className="grid grid-cols-2 gap-4 font-mono text-sm">
        <div className="rounded border border-zinc-800 p-4">
          <p className="text-zinc-500">P&amp;L</p>
          <p className={state.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            ${state.pnl.toFixed(2)}
          </p>
        </div>
        <div className="rounded border border-zinc-800 p-4">
          <p className="text-zinc-500">Conduct</p>
          <p className="text-cyan-300">{state.conductScore}</p>
        </div>
        <div className="col-span-2 rounded border border-zinc-800 p-4">
          <p className="text-zinc-500">Rank</p>
          <p className="font-pixel text-[10px] text-cyan-300">
            {state.rank ?? 'Pending'}
          </p>
        </div>
      </div>
      <p className="mt-6 font-mono text-xs text-zinc-500">
        Rank thresholds and audit badges land in Slice 4.
      </p>
    </PageShell>
  );
}
