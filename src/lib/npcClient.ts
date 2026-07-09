import type { ChatMessage } from '@/components/npc-chat';
import type { NpcPersona, NpcResponse } from '@/lib/npc';

export type NpcRequestResult =
  | { ok: true; data: NpcResponse }
  | { ok: false; error: string };

export async function requestNpc(
  persona: NpcPersona,
  messages: ChatMessage[],
  deskContext?: string
): Promise<NpcRequestResult> {
  try {
    const res = await fetch('/api/npc', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        persona,
        messages,
        ...(deskContext ? { deskContext } : {}),
      }),
    });

    if (!res.ok) {
      return { ok: false, error: `NPC request failed (${res.status})` };
    }

    const data = (await res.json()) as NpcResponse;
    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'NPC network error',
    };
  }
}
