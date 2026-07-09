export type NpcPersonaId = 'manager' | 'compliance' | 'tech';

export interface NpcPersonaTheme {
  id: NpcPersonaId;
  displayName: string;
  initial: string;
  accent: string;
  accentSoft: string;
  accentRgb: string;
  bubbleBg: string;
  bubbleBorder: string;
  tagColor: string;
  glow: string;
  border: string;
  bg: string;
}

export const NPC_THEMES: Record<NpcPersonaId, NpcPersonaTheme> = {
  manager: {
    id: 'manager',
    displayName: 'Vince Cole',
    initial: 'V',
    accent: '#f97316',
    accentSoft: 'rgba(249, 115, 22, 0.14)',
    accentRgb: '249, 115, 22',
    bubbleBg: 'rgba(249, 115, 22, 0.12)',
    bubbleBorder: 'rgba(251, 146, 60, 0.55)',
    tagColor: '#fdba74',
    glow: 'rgba(249, 115, 22, 0.35)',
    border: 'rgba(249, 115, 22, 0.45)',
    bg: 'rgba(28, 12, 6, 0.55)',
  },
  compliance: {
    id: 'compliance',
    displayName: 'Compliance',
    initial: 'C',
    accent: '#38bdf8',
    accentSoft: 'rgba(56, 189, 248, 0.12)',
    accentRgb: '56, 189, 248',
    bubbleBg: 'rgba(56, 189, 248, 0.1)',
    bubbleBorder: 'rgba(125, 211, 252, 0.45)',
    tagColor: '#7dd3fc',
    glow: 'rgba(56, 189, 248, 0.3)',
    border: 'rgba(56, 189, 248, 0.4)',
    bg: 'rgba(6, 16, 28, 0.55)',
  },
  tech: {
    id: 'tech',
    displayName: 'Tech Support',
    initial: 'T',
    accent: '#a1a1aa',
    accentSoft: 'rgba(161, 161, 170, 0.1)',
    accentRgb: '161, 161, 170',
    bubbleBg: 'rgba(161, 161, 170, 0.08)',
    bubbleBorder: 'rgba(161, 161, 170, 0.35)',
    tagColor: '#d4d4d8',
    glow: 'rgba(161, 161, 170, 0.2)',
    border: 'rgba(161, 161, 170, 0.35)',
    bg: 'rgba(14, 14, 16, 0.55)',
  },
};

export function getNpcTheme(persona: NpcPersonaId): NpcPersonaTheme {
  return NPC_THEMES[persona];
}
