/** Visible desk fields Tech can reference during glitch diagnostics. */
export function buildTechDeskContext(input: {
  lastPrice: number;
  chartPointCount: number;
  lastChartDate?: string;
  positionQty: number;
  cash: number;
  pnl: number;
  feedFrozen: boolean;
}): string {
  const price =
    input.lastPrice > 0 ? `$${input.lastPrice.toFixed(2)}` : 'not loaded yet';
  const chartDate = input.lastChartDate ?? 'unknown';
  const frozen = input.feedFrozen ? 'yes (order ticket shows FEED FROZEN)' : 'no';

  return [
    `LAST price on feed: ${price}`,
    `Chart points plotted: ${input.chartPointCount}`,
    `Rightmost chart date label: ${chartDate}`,
    `Position: ${input.positionQty} shares`,
    `Cash: $${input.cash.toFixed(2)}`,
    `Session P&L: $${input.pnl.toFixed(2)}`,
    `Feed frozen banner: ${frozen}`,
    'There is NO live clock, NO timestamp, and NO tick counter on the player UI.',
  ].join('\n');
}
