/**
 * Resolves a Postgres connection string for server-side migrations.
 * Prefers explicit Vercel/Supabase env vars; rewrites IPv6-only direct hosts to pooler.
 */
export function resolveDatabaseUrl(): string | undefined {
  const candidates = [
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.POSTGRES_URL,
    process.env.DATABASE_URL,
    process.env.SUPABASE_DATABASE_URL,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeDatabaseUrl(candidate);
    if (normalized) return normalized;
  }

  return buildUrlFromPassword();
}

function normalizeDatabaseUrl(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;

  try {
    const url = new URL(trimmed.replace(/^postgres:\/\//, 'postgresql://'));
    const host = url.hostname;

    if (host.startsWith('db.') && host.endsWith('.supabase.co')) {
      const ref = host.slice(3, -'.supabase.co'.length);
      const password = url.password;
      if (!password) return trimmed;
      return buildPoolerUrl(ref, password, url.pathname || '/postgres');
    }

    return trimmed;
  } catch {
    return trimmed;
  }
}

function buildUrlFromPassword(): string | undefined {
  const hostOverride = process.env.SUPABASE_DB_HOST?.trim();
  const password =
    process.env.SUPABASE_DB_PASSWORD?.trim() ??
    process.env.DATABASE_PASSWORD?.trim();
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!password || !publicUrl) return undefined;

  try {
    const ref = new URL(publicUrl).hostname.split('.')[0];

    if (hostOverride) {
      const user = hostOverride.includes('pooler')
        ? `postgres.${ref}`
        : 'postgres';
      return `postgresql://${user}:${encodeURIComponent(password)}@${hostOverride}:5432/postgres`;
    }

    return buildPoolerUrl(ref, password, '/postgres');
  } catch {
    return undefined;
  }
}

function buildPoolerUrl(
  ref: string,
  password: string,
  pathname: string
): string {
  const region = process.env.SUPABASE_REGION?.trim() ?? 'us-east-1';
  const encodedPassword = encodeURIComponent(decodeURIComponent(password));
  return `postgresql://postgres.${ref}:${encodedPassword}@aws-0-${region}.pooler.supabase.com:5432${pathname}`;
}
