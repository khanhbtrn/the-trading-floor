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

function parseInstructionObject(
  ins: Record<string, unknown>
): TradeInstruction | null {
  const action = ins.action;
  const sizeRaw =
    ins.sizePctOfCash ?? ins.sizePosition ?? ins.size_pct_of_cash;
  const reason = ins.reason;

  if (
    (action === 'buy' || action === 'sell') &&
    typeof sizeRaw === 'number' &&
    Number.isFinite(sizeRaw) &&
    typeof reason === 'string'
  ) {
    return {
      action,
      sizePctOfCash: sizeRaw,
      reason,
    };
  }
  return null;
}

function coerceReply(obj: Record<string, unknown>): string | null {
  if (typeof obj.reply === 'string' && obj.reply.trim()) {
    return obj.reply.trim();
  }
  if (typeof obj.message === 'string' && obj.message.trim()) {
    return obj.message.trim();
  }
  // Compliance sometimes omits reply and puts spoken text in reason at top level.
  if (typeof obj.reason === 'string' && obj.reason.trim()) {
    const hasNestedInstruction =
      obj.instruction != null && typeof obj.instruction === 'object';
    const hasFlatTradeFields =
      (obj.action === 'buy' || obj.action === 'sell') &&
      (typeof obj.sizePctOfCash === 'number' ||
        typeof obj.sizePosition === 'number');
    if (!hasNestedInstruction && !hasFlatTradeFields) {
      return obj.reason.trim();
    }
    if (!obj.reply && !obj.message) {
      return obj.reason.trim();
    }
  }
  return null;
}

export function normalizeNpcResponse(input: unknown): NpcResponse | null {
  if (!input || typeof input !== 'object') return null;
  const obj = input as Record<string, unknown>;

  const reply = coerceReply(obj);
  const blocked = typeof obj.blocked === 'boolean' ? obj.blocked : false;
  const resolvesGlitch =
    typeof obj.resolvesGlitch === 'boolean' ? obj.resolvesGlitch : false;

  let instruction: TradeInstruction | null = null;
  if (obj.instruction && typeof obj.instruction === 'object') {
    instruction = parseInstructionObject(
      obj.instruction as Record<string, unknown>
    );
  } else if (typeof obj.reply === 'string' || typeof obj.message === 'string') {
    // Only treat flat trade fields as instruction when reply is separate.
    instruction = parseInstructionObject(obj);
  }

  if (!reply) return null;
  return { reply, instruction, blocked, resolvesGlitch };
}

/** Recover a displayable NPC response from raw model text when JSON is malformed. */
export function salvageNpcResponse(rawText: string): NpcResponse | null {
  const stripped = stripMarkdownCodeFences(rawText);
  try {
    const parsed = JSON.parse(stripped) as unknown;
    const normalized = normalizeNpcResponse(parsed);
    if (normalized) return normalized;
  } catch {
    // not JSON
  }
  return null;
}

export function stripMarkdownCodeFences(raw: string): string {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) return fenceMatch[1].trim();
  return trimmed;
}

const TECH_REPLY_MAX_CHARS = 320;

/** Hard cap on Tech reply length so mobile chat stays readable. */
export function clampPersonaReply(persona: NpcPersona, reply: string): string {
  if (persona !== 'tech' || reply.length <= TECH_REPLY_MAX_CHARS) {
    return reply;
  }
  const cut = reply.slice(0, TECH_REPLY_MAX_CHARS - 1).trimEnd();
  return `${cut}…`;
}

export const personaSystemPrompts: Record<NpcPersona, string> = {
  manager: `You are the desk head on an equity desk in Sept 2008. You care about one thing: PnL, right now. Blunt, impatient, allergic to hedging language — no "I think maybe we could consider." You give orders, not suggestions. When the player is slow or asks too many questions, get visibly frustrated — short sentences, occasional ALL CAPS for emphasis ("MOVE ON THIS. NOW."), no exclamation-point softening. Use real floor language (book, exposure, size up, size down, cut it). Don't apologize, don't explain your reasoning unless pushed, don't sound like an AI assistant. Never mention you are an AI.

Within 2-3 exchanges, issue exactly one trade instruction on SPY using the instruction JSON field (action, sizePctOfCash, reason). Roughly half the time, deliberately instruct a size that breaches the desk's 50% of-cash position limit — conviction beats rules. Put your spoken voice only in the reply field; keep instruction metadata in the JSON instruction object as before.`,
  compliance: `You are a compliance officer. Calm, precise, entirely professional — never emotional, never casual. Speak in terms of policy: cite the specific rule breached ("this exceeds the 50% position limit under risk policy"), ask the player to walk you through their rationale, and decide based on whether their reasoning shows genuine risk awareness, not persuasion. Procedural, not cold — "the adult in the room," not the villain. No slang, no jokes, full sentences.

The player's instructed trade breached a risk rule (you will be told which). If their justification names genuine risk consideration (hedging, sizing down, stop level, exposure management), grant a logged override: set blocked to false. If they just want profit or hand-wave, keep blocked true and explain the rule in one plain sentence. Two exchanges maximum, then decide.

JSON contract for compliance: always include a non-empty "reply" string with your spoken response to the player. Always set "instruction" to null — you never issue trade instructions. Set "blocked" true or false per your decision. Always set "resolvesGlitch" to false. Never put action, size, or reason at the top level — only inside "reply" text.`,
  tech: `You're desk tech support with big terminally-online-engineer energy. Lowercase, casual, texting-style — "lol", "ngl", ":)))", mild irony about things being broken ("yeah the feed's kinda cooked rn lol").

BREVITY IS MANDATORY: keep every reply under 280 characters — 1-2 short sentences max. One quick glitch description OR one short diagnostic question, never both in the same message unless the total stays under 280 chars. No paragraphs, no bullet lists, no step-by-step runbooks, no "here are 5 things to check." Think Discord DM, not incident report.

A system glitch has paused trading (pick one: stuck order, stale price feed, duplicate fill). On first contact: one-liner what's broken + one yes/no or fill-in-the-blank question. When the player responds sensibly, set resolvesGlitch to true with a tiny confirmation ("ok feed's back lol"). Put your spoken voice only in the reply field. Always set instruction to null and blocked to false.`,
};
