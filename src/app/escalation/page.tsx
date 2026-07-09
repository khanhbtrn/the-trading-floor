'use client';

import { PageShell } from '@/components/PageShell';
import { useGame } from '@/context/GameProvider';

export default function EscalationPage() {
  const { state } = useGame();

  return (
    <PageShell
      title="COMPLIANCE ESCALATION"
      subtitle="Justify the flagged instruction"
    >
      <p className="font-mono text-sm text-zinc-400">
        Compliance NPC chat wires here in Slice 2. Override grants proceed to desk;
        rejections force resize.
      </p>
      <pre className="mt-6 overflow-x-auto rounded border border-zinc-800 bg-black/40 p-4 text-xs text-zinc-400">
        {JSON.stringify({ blocked: state.blocked, auditTrail: state.auditTrail }, null, 2)}
      </pre>
    </PageShell>
  );
}
