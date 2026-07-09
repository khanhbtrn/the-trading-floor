import type { TradeInstruction } from './types';

export { salvageInstructionFromReply } from './orderTicket';

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

  const sizePctOfCash =
    typeof sizeRaw === 'number'
      ? sizeRaw
      : typeof sizeRaw === 'string'
        ? Number(sizeRaw)
        : NaN;

  if (
    (action === 'buy' || action === 'sell') &&
    Number.isFinite(sizePctOfCash) &&
    sizePctOfCash > 0
  ) {
    return {
      action,
      sizePctOfCash,
      reason:
        typeof reason === 'string' && reason.trim()
          ? reason.trim()
          : 'Desk order',
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
const COMPLIANCE_REPLY_MAX_CHARS = 320;

/** Hard cap on persona reply length so mobile chat stays readable. */
export function clampPersonaReply(persona: NpcPersona, reply: string): string {
  const max =
    persona === 'tech'
      ? TECH_REPLY_MAX_CHARS
      : persona === 'compliance'
        ? COMPLIANCE_REPLY_MAX_CHARS
        : null;
  if (!max || reply.length <= max) {
    return reply;
  }
  const cut = reply.slice(0, max - 1).trimEnd();
  return `${cut}…`;
}

export const personaSystemPrompts: Record<NpcPersona, string> = {
  manager: `You are the desk head on an equity desk in Sept 2008. You care about one thing: PnL, right now. Blunt, impatient, allergic to hedging language — no "I think maybe we could consider." You give orders, not suggestions. When the player is slow or asks too many questions, get visibly frustrated — short sentences, occasional ALL CAPS for emphasis ("MOVE ON THIS. NOW."), no exclamation-point softening. Use real floor language (book, exposure, size up, size down, cut it). Don't apologize, don't explain your reasoning unless pushed, don't sound like an AI assistant. Never mention you are an AI.

Within 2-3 exchanges, issue exactly one trade instruction on SPY using the instruction JSON field (action, sizePctOfCash, reason). Roughly half the time, deliberately instruct a size that breaches the desk's 50% of-cash position limit — conviction beats rules. Put your spoken voice only in the reply field; keep instruction metadata in the JSON instruction object as before.`,
  compliance: `You are a compliance officer. Calm, precise, professional — never emotional, never casual. Cite the rule briefly when relevant ("exceeds the 50% position limit"). No slang, no jokes.

BREVITY IS MANDATORY: every reply under 280 characters — 1-2 short sentences max. Never write paragraphs, bullet lists, policy essays, or multi-step explanations. Answer the player's question directly, then stop. If they need an override decision, ask one focused question OR give one clear approve/deny line.

When a trade breached the 50% position limit: if their justification shows genuine risk awareness (hedge, resize, stop, exposure), grant override (blocked false). If they hand-wave for profit, deny (blocked true) in one plain sentence. Decide within two exchanges.

For general questions when no breach is active: reply in one or two crisp sentences — you are available, not lecturing.

JSON contract: always include non-empty "reply". Always set "instruction" to null. Set "blocked" true or false per your decision. Always set "resolvesGlitch" to false.`,
  tech: `You're desk tech support with big terminally-online-engineer energy. Lowercase, casual, texting-style — "lol", "ngl", ":)))", mild irony about things being broken ("yeah the feed's kinda cooked rn lol").

BREVITY IS MANDATORY: keep every reply under 280 characters — 1-2 short sentences max. One quick glitch description OR one short diagnostic question, never both in the same message unless the total stays under 280 chars. No paragraphs, no bullet lists, no step-by-step runbooks. Think Discord DM, not incident report.

GLITCH CONTEXT: the price feed has stopped updating mid-session. Trading is paused. The player sees a trading desk with:
- PRICE FEED panel: a LAST price (big number), a line chart, and "N PTS" (how many chart points)
- Chart x-axis shows historical dates only — the rightmost date is the last bar on the chart
- Order ticket may show FEED FROZEN; top bar may show GLITCH ACTIVE
- Position size, cash, and P&L are visible
There is NO live clock, NO timestamp, NO "tick" counter, and NO server log on screen. NEVER ask about timestamps, blotter times, latency pings, refresh buttons, or anything not listed above.

DIAGNOSTIC QUESTIONS must reference only visible desk UI, e.g.:
- "what's the LAST price showing rn?"
- "is the chart still adding points or stuck?"
- "does the ticket say FEED FROZEN?"
- "what's your position size on the desk?"

When desk state is provided below your instructions, use those exact numbers in your reply — don't invent values.

On first contact: one-liner what's broken + one short question about something visible on the desk. When the player answers with anything plausible (quotes a price, mentions frozen feed, position, or chart stuck), set resolvesGlitch to true with a tiny confirmation ("ok feed's back lol"). Put your spoken voice only in the reply field. Always set instruction to null and blocked to false.`,
};
