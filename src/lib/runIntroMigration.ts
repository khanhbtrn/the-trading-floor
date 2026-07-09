import postgres from 'postgres';

export type IntroMigrationResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

function resolveDatabaseUrl(): string | undefined {
  const direct =
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.POSTGRES_URL ??
    process.env.DATABASE_URL ??
    process.env.SUPABASE_DATABASE_URL;
  if (direct?.trim()) return direct.trim();

  const password =
    process.env.SUPABASE_DB_PASSWORD?.trim() ??
    process.env.DATABASE_PASSWORD?.trim();
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!password || !publicUrl) return undefined;

  try {
    const ref = new URL(publicUrl).hostname.split('.')[0];
    return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
  } catch {
    return undefined;
  }
}

/** Idempotent DDL for players.intro_completed — requires POSTGRES_URL or DATABASE_URL on Vercel. */
export async function runIntroMigration(): Promise<IntroMigrationResult> {
  const connectionString = resolveDatabaseUrl();

  if (!connectionString) {
    return {
      ok: false,
      error:
        'No database connection string. Add POSTGRES_URL (Supabase → Database → Connection string → URI) or SUPABASE_DB_PASSWORD to Vercel, then redeploy.',
    };
  }

  const sql = postgres(connectionString, {
    ssl: 'require',
    max: 1,
    idle_timeout: 5,
    connect_timeout: 15,
  });

  try {
    await sql.unsafe(`
      alter table public.players
        add column if not exists intro_completed boolean default false;
    `);

    await sql.unsafe(`
      update public.players
      set intro_completed = true
      where sessions_played > 0
        and coalesce(intro_completed, false) = false;
    `);

    return { ok: true, message: 'intro_completed column ready' };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Migration failed',
    };
  } finally {
    await sql.end({ timeout: 2 });
  }
}
