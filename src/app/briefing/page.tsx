'use client';

import { useCallback, useMemo, useState } from 'react';
import { PageShell } from '@/components/PageShell';
import { NpcChatView, type ChatMessage } from '@/components/npc-chat';
import { useGame } from '@/context/GameProvider';
import { getScenarioById } from '@/lib/scenarios';
import { useSpeechInput } from '@/lib/useSpeechInput';
import type { NpcResponse } from '@/lib/npc';

async function requestNpc(
  persona: 'manager' | 'compliance' | 'tech',
  messages: ChatMessage[]
): Promise<NpcResponse> {
  const res = await fetch('/api/npc', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ persona, messages }),
  });

  if (!res.ok) {
    throw new Error('NPC route request failed');
  }

  return (await res.json()) as NpcResponse;
}

export default function BriefingPage() {
  const { state, dispatch } = useGame();
  const scenario = state.scenarioId ? getScenarioById(state.scenarioId) : null;
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'npc',
      text: 'Morning. The tape is unstable. Give me your read before we size this ticket.',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [instructionIssued, setInstructionIssued] = useState(false);

  const sendToNpc = useCallback(
    async (text: string) => {
      const userMessage: ChatMessage = { role: 'user', text };
      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setIsLoading(true);

      try {
        const npc = await requestNpc('manager', nextMessages);
        const npcMessage: ChatMessage = { role: 'npc', text: npc.reply };
        setMessages((prev) => [...prev, npcMessage]);

        if (npc.instruction) {
          dispatch({
            type: 'PATCH',
            patch: {
              currentInstruction: npc.instruction,
              blocked: false,
            },
          });
          setInstructionIssued(true);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [messages, dispatch]
  );

  const { speechSupported, startListening } = useSpeechInput((transcript) => {
    void sendToNpc(transcript);
  });

  const subtitle = useMemo(
    () =>
      scenario
        ? `${scenario.displayName} — ${scenario.ticker}`
        : 'No scenario selected',
    [scenario]
  );

  return (
    <PageShell title="MORNING BRIEFING" subtitle={subtitle}>
      <NpcChatView
        messages={messages}
        npcName="Manager"
        isLoading={isLoading}
        showFreeTextInput={!instructionIssued}
        onSend={(text) => {
          void sendToNpc(text);
        }}
        onMicPress={speechSupported ? startListening : undefined}
        instructionPreview={
          state.currentInstruction
            ? `${state.currentInstruction.action.toUpperCase()} ${state.currentInstruction.sizePctOfCash}% cash (${state.currentInstruction.reason})`
            : undefined
        }
        onProceed={
          state.currentInstruction
            ? () => {
                window.location.href = '/risk-check';
              }
            : undefined
        }
        proceedLabel="Proceed to Risk Check"
      />
    </PageShell>
  );
}
