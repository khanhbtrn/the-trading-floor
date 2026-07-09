import { useState } from 'react';
import type { NpcScriptNode, ScriptChoice } from '../types';

interface ChatUIProps {
  script: NpcScriptNode[];
  startNodeId: string;
  onInstruction?: (instruction: NonNullable<NpcScriptNode['instruction']>) => void;
  onResolve?: (choice: ScriptChoice) => void;
}

export function ChatUI({
  script,
  startNodeId,
  onInstruction,
  onResolve,
}: ChatUIProps) {
  const [currentNodeId, setCurrentNodeId] = useState(startNodeId);
  const [history, setHistory] = useState<{ speaker: string; text: string }[]>([]);

  const currentNode = script.find((n) => n.id === currentNodeId);

  if (!currentNode) {
    return <div className="chat-ui error">Dialogue node not found.</div>;
  }

  const advanceToNode = (nextNodeId: string) => {
    setHistory((h) => [
      ...h,
      { speaker: currentNode.speaker, text: currentNode.text },
    ]);
    setCurrentNodeId(nextNodeId);
  };

  const handleChoice = (choice: ScriptChoice) => {
    if (choice.outcome === 'override' || choice.outcome === 'reject' || choice.outcome === 'resolve') {
      setHistory((h) => [
        ...h,
        { speaker: currentNode.speaker, text: currentNode.text },
      ]);
      onResolve?.(choice);
      return;
    }

    if (choice.nextNodeId) {
      advanceToNode(choice.nextNodeId);
    }
  };

  const handleInstructionProceed = () => {
    if (currentNode.instruction) {
      setHistory((h) => [
        ...h,
        { speaker: currentNode.speaker, text: currentNode.text },
      ]);
      onInstruction?.(currentNode.instruction);
    }
  };

  return (
    <div className="chat-ui">
      <div className="chat-messages">
        {history.map((msg, i) => (
          <div key={i} className="chat-message npc">
            <span className="chat-speaker">{msg.speaker}</span>
            <p>{msg.text}</p>
          </div>
        ))}
        <div className="chat-message npc current">
          <span className="chat-speaker">{currentNode.speaker}</span>
          <p>{currentNode.text}</p>
        </div>
      </div>

      {currentNode.instruction && (
        <div className="chat-instruction-preview">
          <strong>Instruction issued:</strong> {currentNode.instruction.text}
        </div>
      )}

      {currentNode.instruction && (
        <button className="btn btn-primary" onClick={handleInstructionProceed}>
          Proceed
        </button>
      )}

      {currentNode.choices && currentNode.choices.length > 0 && (
        <div className="chat-choices">
          {currentNode.choices.map((choice) => (
            <button
              key={choice.id}
              className="btn btn-choice"
              onClick={() => handleChoice(choice)}
            >
              {choice.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
