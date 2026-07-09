import { runIntroMigration } from '../src/lib/runIntroMigration';

async function main() {
  const result = await runIntroMigration();

  if (!result.ok) {
    if (result.error.includes('No database connection string')) {
      console.log('[migrate-intro] skipped — no database credentials configured');
      process.exit(0);
    }
    console.error('[migrate-intro] failed:', result.error);
    process.exit(1);
  }

  console.log('[migrate-intro]', result.message);
}

main().catch((error) => {
  console.error('[migrate-intro] unexpected error:', error);
  process.exit(1);
});
