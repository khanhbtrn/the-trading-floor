import type { ChatMessage } from '@/components/npc-chat';
import type { NpcPersona, NpcResponse } from '@/lib/npc';

export async function requestNpc(
  persona: NpcPersona,
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
