'use client';

import { PageShell } from '@/components/PageShell';
import { useGame } from '@/context/GameProvider';

export default function RiskCheckPage() {
  const { state } = useGame();

  return (
    <PageShell
      title="RISK CHECK"
      subtitle="Automated pre-trade compliance scan"
    >
      <div
        className={`rounded border p-8 text-center font-pixel text-lg ${
          state.blocked
            ? 'border-red-500/60 bg-red-950/30 text-red-400'
            : 'border-emerald-500/60 bg-emerald-950/30 text-emerald-400'
        }`}
      >
        {state.blocked ? 'BLOCKED' : 'PASS'}
      </div>
      <p className="mt-6 font-mono text-sm text-zinc-400">
        Risk rules engine lands in Slice 3 (maxPositionPctOfCash: 50).
      </p>
    </PageShell>
  );
}
