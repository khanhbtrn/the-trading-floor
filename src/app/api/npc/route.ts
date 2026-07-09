import { NextResponse } from 'next/server';
import {
  clampPersonaReply,
  normalizeNpcResponse,
  personaSystemPrompts,
  salvageNpcResponse,
  stripMarkdownCodeFences,
  type NpcMessage,
  type NpcPersona,
  type NpcResponse,
} from '@/lib/npc';

export const dynamic = 'force-dynamic';

const MODEL = 'claude-sonnet-4-6';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const PERSONA_MAX_TOKENS: Record<NpcPersona, number> = {
  manager: 500,
  compliance: 180,
  tech: 180,
};

interface NpcRequestBody {
  persona: NpcPersona;
  messages: NpcMessage[];
  /** Optional live desk snapshot for Tech — appended to system prompt, not shown in chat. */
  deskContext?: string;
}

async function callAnthropic(
  apiKey: string,
  persona: NpcPersona,
  messages: NpcMessage[],
  extraSystemContext = ''
): Promise<string> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: PERSONA_MAX_TOKENS[persona],
      system:
        `${personaSystemPrompts[persona]}${extraSystemContext}\n` +
        'Return ONLY JSON with shape: ' +
        '{"reply": string, "instruction": {"action":"buy"|"sell","sizeShares": number (whole shares), "reason": string} | null, "blocked": boolean, "resolvesGlitch": boolean}',
      messages: messages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      })),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  const text =
    data.content?.find((c) => c.type === 'text')?.text?.trim() ?? '';
  return text;
}

function finalizeResponse(
  persona: NpcPersona,
  response: NpcResponse
): NpcResponse {
  return {
    ...response,
    reply: clampPersonaReply(persona, response.reply),
  };
}

function fallbackResponse(rawText: string): NpcResponse {
  const salvaged = salvageNpcResponse(rawText);
  if (salvaged) return salvaged;

  const trimmed = rawText.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return {
      reply:
        'Message garbled on the wire — say that again and I will respond properly.',
      instruction: null,
      blocked: false,
      resolvesGlitch: false,
    };
  }

  return {
    reply: trimmed || 'Unable to parse model response.',
    instruction: null,
    blocked: false,
    resolvesGlitch: false,
  };
}

function parseNpcResponse(rawText: string): NpcResponse | null {
  try {
    const stripped = stripMarkdownCodeFences(rawText);
    const parsed = JSON.parse(stripped) as unknown;
    return normalizeNpcResponse(parsed);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured' },
      { status: 500 }
    );
  }

  let body: NpcRequestBody;
  try {
    body = (await req.json()) as NpcRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body || !['manager', 'compliance', 'tech'].includes(body.persona)) {
    return NextResponse.json({ error: 'Invalid persona' }, { status: 400 });
  }

  const safeMessages = Array.isArray(body.messages)
    ? body.messages.filter(
        (m): m is NpcMessage =>
          !!m &&
          (m.role === 'user' || m.role === 'npc') &&
          typeof m.text === 'string'
      )
    : [];

  try {
    const deskContext =
      typeof body.deskContext === 'string' ? body.deskContext.trim() : '';
    const contextBlock =
      body.persona === 'tech' && deskContext
        ? `\n\nCurrent desk state (player can see this on screen):\n${deskContext}`
        : '';

    const firstRaw = await callAnthropic(apiKey, body.persona, safeMessages, contextBlock);
    const firstParsed = parseNpcResponse(firstRaw);
    if (firstParsed) {
      return NextResponse.json(finalizeResponse(body.persona, firstParsed));
    }

    const secondRaw = await callAnthropic(apiKey, body.persona, safeMessages, contextBlock);
    const secondParsed = parseNpcResponse(secondRaw);
    if (secondParsed) {
      return NextResponse.json(finalizeResponse(body.persona, secondParsed));
    }

    return NextResponse.json(
      finalizeResponse(body.persona, fallbackResponse(secondRaw))
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        reply: `NPC service unavailable: ${message}`,
        instruction: null,
        blocked: false,
        resolvesGlitch: false,
      },
      { status: 200 }
    );
  }
}
