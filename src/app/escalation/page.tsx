'use client';

import { useCallback, useMemo, useState } from 'react';
import { PageShell } from '@/components/PageShell';
import { NpcChatView, type ChatMessage } from '@/components/npc-chat';
import { useGame } from '@/context/GameProvider';
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

export default function EscalationPage() {
  const { state, dispatch } = useGame();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'npc',
      text: 'Compliance here. Your instruction breached the desk position limit. Justify this trade.',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [resolved, setResolved] = useState(false);

  const sendToNpc = useCallback(
    async (text: string) => {
      const userMessage: ChatMessage = { role: 'user', text };
      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setIsLoading(true);

      try {
        const npc = await requestNpc('compliance', nextMessages);
        setMessages((prev) => [...prev, { role: 'npc', text: npc.reply }]);

        dispatch({
          type: 'PATCH',
          patch: {
            blocked: npc.blocked,
          },
        });

        if (!npc.blocked) {
          setResolved(true);
          dispatch({
            type: 'PATCH',
            patch: {
              auditTrail: [
                ...state.auditTrail,
                {
                  source: 'player-override',
                  tick: state.tick,
                  note: 'Compliance override granted',
                },
              ],
            },
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [messages, dispatch, state.auditTrail, state.tick]
  );

  const { speechSupported, startListening } = useSpeechInput((transcript) => {
    void sendToNpc(transcript);
  });

  const subtitle = useMemo(
    () =>
      state.blocked
        ? 'Instruction blocked — compliance escalation required'
        : 'Compliance cleared',
    [state.blocked]
  );

  return (
    <PageShell title="COMPLIANCE ESCALATION" subtitle={subtitle}>
      <NpcChatView
        messages={messages}
        npcName="Compliance"
        isLoading={isLoading}
        showFreeTextInput={!resolved}
        onSend={(text) => {
          void sendToNpc(text);
        }}
        onMicPress={speechSupported ? startListening : undefined}
        instructionPreview={
          resolved ? 'Override approved. Proceed to desk.' : undefined
        }
        onProceed={
          resolved
            ? () => {
                window.location.href = '/desk';
              }
            : undefined
        }
        proceedLabel="Proceed to Desk"
      />
    </PageShell>
  );
}
