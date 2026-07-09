'use client';

import { PageShell } from '@/components/PageShell';
import { useGame } from '@/context/GameProvider';

export default function DeskPage() {
  const { state } = useGame();

  return (
    <PageShell
      title="TRADING DESK"
      subtitle="Live price feed + order ticket"
    >
      <p className="font-mono text-sm text-zinc-400">
        TradingDeskView + CSV replay land in Slice 1. Glitch overlay lands in Slice 2b.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-4 font-mono text-sm">
        <div className="rounded border border-zinc-800 p-4">
          <p className="text-zinc-500">tick</p>
          <p className="text-cyan-300">{state.tick}</p>
        </div>
        <div className="rounded border border-zinc-800 p-4">
          <p className="text-zinc-500">price</p>
          <p className="text-cyan-300">{state.price.toFixed(2)}</p>
        </div>
        <div className="rounded border border-zinc-800 p-4">
          <p className="text-zinc-500">position</p>
          <p className="text-cyan-300">
            {state.position.qty} @ {state.position.avgPrice.toFixed(2)}
          </p>
        </div>
        <div className="rounded border border-zinc-800 p-4">
          <p className="text-zinc-500">pnl</p>
          <p className={state.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            {state.pnl.toFixed(2)}
          </p>
        </div>
      </div>
      {state.glitchActive && (
        <p className="mt-4 font-pixel text-[10px] text-amber-400">
          GLITCH ACTIVE — trading paused
        </p>
      )}
    </PageShell>
  );
}
