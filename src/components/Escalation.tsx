'use client';

import { CONDUCT_DELTAS } from '@/lib/constants';
import type { GameState, ScriptChoice } from '@/lib/types';
import { ChatUI } from './ChatUI';

interface EscalationProps {
  state: GameState;
  onOverride: (note: string, conductDelta: number) => void;
  onReject: (note: string) => void;
}

export function Escalation({ state, onOverride, onReject }: EscalationProps) {
  if (!state.blocked || !state.scenario) {
    return null;
  }

  const scenario = state.scenario;
  const startNodeId = scenario.complianceScript[0]?.id ?? '';

  const handleResolve = (choice: ScriptChoice) => {
    const note = choice.justification ?? choice.label;
    if (choice.outcome === 'override') {
      onOverride(note, CONDUCT_DELTAS.OVERRIDE);
    } else if (choice.outcome === 'reject') {
      onReject(note);
    }
  };

  return (
    <div className="screen escalation">
      <header className="screen-header">
        <h1>Compliance Escalation</h1>
        <p className="subtitle">Risk check failed — justification required</p>
      </header>
      <ChatUI
        script={scenario.complianceScript}
        startNodeId={startNodeId}
        variant="embedded"
        onResolve={handleResolve}
      />
    </div>
  );
}
