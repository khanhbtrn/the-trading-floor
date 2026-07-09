import { NextResponse } from 'next/server';
import { runIntroMigration } from '@/lib/runIntroMigration';

export const dynamic = 'force-dynamic';

/** One-shot idempotent migration — safe to call multiple times. */
export async function POST() {
  const result = await runIntroMigration();

  if (!result.ok) {
    return NextResponse.json(result, { status: 503 });
  }

  return NextResponse.json(result);
}

export async function GET() {
  return POST();
}
