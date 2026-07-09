/**
 * Resolves a Postgres connection string for server-side migrations.
 * Prefers explicit Vercel/Supabase env vars; falls back to password + project ref.
 */
export function resolveDatabaseUrl(): string | undefined {
  const direct =
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.POSTGRES_URL ??
    process.env.DATABASE_URL ??
    process.env.SUPABASE_DATABASE_URL;
  if (direct?.trim()) return direct.trim();

  const hostOverride = process.env.SUPABASE_DB_HOST?.trim();
  const password =
    process.env.SUPABASE_DB_PASSWORD?.trim() ??
    process.env.DATABASE_PASSWORD?.trim();
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!password || !publicUrl) return undefined;

  try {
    const ref = new URL(publicUrl).hostname.split('.')[0];
    const region = process.env.SUPABASE_REGION?.trim() ?? 'us-east-1';

    if (hostOverride) {
      const user = hostOverride.includes('pooler')
        ? `postgres.${ref}`
        : 'postgres';
      return `postgresql://${user}:${encodeURIComponent(password)}@${hostOverride}:5432/postgres`;
    }

    // Session pooler — IPv4-friendly on Vercel (direct db.* host is often IPv6-only).
    return `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-${region}.pooler.supabase.com:5432/postgres`;
  } catch {
    return undefined;
  }
}
