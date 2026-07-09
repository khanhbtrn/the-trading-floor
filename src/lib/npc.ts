import type { TradeInstruction } from './types';

export type NpcPersona = 'manager' | 'compliance' | 'tech';

export interface NpcMessage {
  role: 'user' | 'npc';
  text: string;
}

export interface NpcResponse {
  reply: string;
  instruction: TradeInstruction | null;
  blocked: boolean;
  resolvesGlitch: boolean;
}

export function normalizeNpcResponse(input: unknown): NpcResponse | null {
  if (!input || typeof input !== 'object') return null;
  const obj = input as Record<string, unknown>;

  const reply = typeof obj.reply === 'string' ? obj.reply : null;
  const blocked = typeof obj.blocked === 'boolean' ? obj.blocked : false;
  const resolvesGlitch =
    typeof obj.resolvesGlitch === 'boolean' ? obj.resolvesGlitch : false;

  let instruction: TradeInstruction | null = null;
  if (obj.instruction && typeof obj.instruction === 'object') {
    const ins = obj.instruction as Record<string, unknown>;
    if (
      (ins.action === 'buy' || ins.action === 'sell') &&
      typeof ins.sizePctOfCash === 'number' &&
      Number.isFinite(ins.sizePctOfCash) &&
      typeof ins.reason === 'string'
    ) {
      instruction = {
        action: ins.action,
        sizePctOfCash: ins.sizePctOfCash,
        reason: ins.reason,
      };
    }
  }

  if (!reply) return null;
  return { reply, instruction, blocked, resolvesGlitch };
}

export function stripMarkdownCodeFences(raw: string): string {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) return fenceMatch[1].trim();
  return trimmed;
}

export const personaSystemPrompts: Record<NpcPersona, string> = {
  manager:
    "You are a results-driven equity desk manager in Sept 2008. Speak in short, pushy sentences. Within 2-3 exchanges, issue exactly one trade instruction on SPY using the instruction JSON field (action, sizePctOfCash, reason). Roughly half the time, deliberately instruct a size that breaches the desk's 50% of-cash position limit - you believe conviction beats rules. Never mention you are an AI.",
  compliance:
    'You are a calm, procedural compliance officer. The player\'s instructed trade breached a risk rule (you will be told which). Ask them to justify it. If their justification names a genuine risk consideration (hedging, sizing down, stop level), grant a logged override: blocked: false. If they just want profit, keep blocked: true and explain the rule in one plain sentence. Two exchanges maximum, then decide.',
  tech:
    'You are a dry, literal desk-support technician. A system glitch has paused trading (pick one: stuck order, stale price feed, duplicate fill). Describe it in one plain sentence, ask the player one diagnostic question, and when they respond sensibly set resolvesGlitch: true. Low stakes, mildly deadpan.',
};
