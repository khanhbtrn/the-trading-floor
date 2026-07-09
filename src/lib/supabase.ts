import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;
let serverClient: SupabaseClient | null = null;

function trimEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function getUrl(): string | undefined {
  return trimEnv(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  );
}

function getAnonKey(): string | undefined {
  return trimEnv(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY
  );
}

function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function createSupabaseClient(url: string, key: string): SupabaseClient | null {
  if (!isValidHttpUrl(url)) {
    console.error('Invalid Supabase URL — expected https://<project>.supabase.co');
    return null;
  }

  try {
    return createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (error) {
    console.error(
      'Failed to create Supabase client:',
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/** Browser client — uses NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY. */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (browserClient) return browserClient;

  const url = getUrl();
  const key = getAnonKey();
  if (!url || !key) return null;

  browserClient = createSupabaseClient(url, key);
  return browserClient;
}

/** Server client — prefers service role, falls back to anon key. */
export function getSupabaseServer(): SupabaseClient | null {
  if (serverClient) return serverClient;

  const url = getUrl();
  const key = trimEnv(process.env.SUPABASE_SERVICE_ROLE_KEY) ?? getAnonKey();
  if (!url || !key) return null;

  serverClient = createSupabaseClient(url, key);
  return serverClient;
}

export interface PlayerRow {
  id: string;
  player_name: string;
  rank: string;
  career_pnl: number;
  sessions_played: number;
  created_at?: string;
  updated_at?: string;
}

export interface GameRow {
  id: string;
  player_id: string;
  scenario_id: string;
  session_pnl: number;
  conduct_score: number;
  final_rank: string;
  created_at?: string;
}
