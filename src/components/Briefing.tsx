import { useCallback } from 'react';
import type { GameState, Instruction } from '../types';
import { ChatUI } from './ChatUI';

interface BriefingProps {
  state: GameState;
  onComplete: (instruction: Instruction) => void;
}

export function Briefing({ state, onComplete }: BriefingProps) {
  const scenario = state.scenario!;
  const startNodeId = scenario.briefingScript[0]?.id ?? '';

  const handleInstruction = useCallback(
    (instruction: Instruction) => {
      onComplete(instruction);
    },
    [onComplete]
  );

  return (
    <div className="screen briefing">
      <header className="screen-header">
        <h1>Morning Briefing</h1>
        <p className="subtitle">{scenario.name} — {scenario.ticker}</p>
      </header>
      <ChatUI
        script={scenario.briefingScript}
        startNodeId={startNodeId}
        variant="embedded"
        onInstruction={handleInstruction}
      />
    </div>
  );
}
