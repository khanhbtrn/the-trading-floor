import postgres from 'postgres';

export type IntroMigrationResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

/** Idempotent DDL for players.intro_completed — requires POSTGRES_URL or DATABASE_URL on Vercel. */
export async function runIntroMigration(): Promise<IntroMigrationResult> {
  const connectionString =
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.POSTGRES_URL ??
    process.env.DATABASE_URL ??
    process.env.SUPABASE_DATABASE_URL;

  if (!connectionString) {
    return {
      ok: false,
      error:
        'No database connection string. Add POSTGRES_URL from Supabase → Project Settings → Database → Connection string (URI) to Vercel env vars.',
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
