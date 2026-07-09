'use client';

import { useMemo, useState } from 'react';
import type { NpcScriptNode, ScriptChoice } from '@/lib/types';
import { NpcChatView, type ChatMessage } from './npc-chat';

interface ChatUIProps {
  script: NpcScriptNode[];
  startNodeId: string;
  variant?: 'standalone' | 'embedded';
  onInstruction?: (instruction: NonNullable<NpcScriptNode['instruction']>) => void;
  onResolve?: (choice: ScriptChoice) => void;
}

export function ChatUI({
  script,
  startNodeId,
  variant = 'embedded',
  onInstruction,
  onResolve,
}: ChatUIProps) {
  const [currentNodeId, setCurrentNodeId] = useState(startNodeId);
  const [history, setHistory] = useState<ChatMessage[]>([]);

  const currentNode = script.find((n) => n.id === currentNodeId);

  const messages = useMemo(() => {
    if (!currentNode) return history;
    return [
      ...history,
      { role: 'npc' as const, text: currentNode.text },
    ];
  }, [history, currentNode]);

  if (!currentNode) {
    return <div className="chat-ui error">Dialogue node not found.</div>;
  }

  const advanceToNode = (nextNodeId: string, userLabel: string) => {
    setHistory((h) => [
      ...h,
      { role: 'npc', text: currentNode.text },
      { role: 'user', text: userLabel },
    ]);
    setCurrentNodeId(nextNodeId);
  };

  const handleChoice = (choice: ScriptChoice) => {
    if (choice.outcome === 'override' || choice.outcome === 'reject' || choice.outcome === 'resolve') {
      setHistory((h) => [
        ...h,
        { role: 'npc', text: currentNode.text },
        { role: 'user', text: choice.label },
      ]);
      onResolve?.(choice);
      return;
    }

    if (choice.nextNodeId) {
      const nextNode = script.find((n) => n.id === choice.nextNodeId);
      if (nextNode?.instruction) {
        setHistory((h) => [
          ...h,
          { role: 'npc', text: currentNode.text },
          { role: 'user', text: choice.label },
          { role: 'npc', text: nextNode.text },
        ]);
        onInstruction?.(nextNode.instruction);
        return;
      }
      advanceToNode(choice.nextNodeId, choice.label);
    }
  };

  const handleInstructionProceed = () => {
    if (currentNode.instruction) {
      setHistory((h) => [
        ...h,
        { role: 'npc', text: currentNode.text },
      ]);
      onInstruction?.(currentNode.instruction);
    }
  };

  const choices =
    currentNode.choices?.map((c) => ({ id: c.id, label: c.label })) ?? [];

  return (
    <NpcChatView
      variant={variant}
      messages={messages}
      npcName={currentNode.speaker}
      choices={currentNode.instruction ? [] : choices}
      onChoice={(choice) => {
        const scriptChoice = currentNode.choices?.find((c) => c.id === choice.id);
        if (scriptChoice) handleChoice(scriptChoice);
      }}
      instructionPreview={currentNode.instruction?.text}
      onProceed={currentNode.instruction ? handleInstructionProceed : undefined}
      proceedLabel="Proceed to Risk Check"
    />
  );
}
