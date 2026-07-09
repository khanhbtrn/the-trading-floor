/** Deterministic glitch clear when the player cites plausible on-screen desk state. */
export function playerAnswerResolvesGlitch(
  userText: string,
  deskContext?: string
): boolean {
  const text = userText.toLowerCase();
  const context = (deskContext ?? '').toLowerCase();
  const combined = `${text} ${context}`;

  const citesPrice =
    /\$?\d{2,3}(\.\d{1,2})?/.test(combined) ||
    /last price|price (is|showing|says)|feed.*\d/i.test(combined);
  const citesFrozen =
    /frozen|stuck|stopped|not moving|not updating|iced|paused|glitch|feed/i.test(
      combined
    );
  const citesChart =
    /chart|points|pts|plot|bar|tape|tick/i.test(combined) ||
    /\b\d{1,3}\s*(points?|pts)\b/i.test(combined);
  const citesPosition =
    /position|shares|flat|cash|pnl|p&l|0 sh/i.test(combined);

  const signalCount = [citesPrice, citesFrozen, citesChart, citesPosition].filter(
    Boolean
  ).length;

  return signalCount >= 2;
}
