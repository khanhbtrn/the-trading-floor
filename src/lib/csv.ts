export interface CsvRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function parseScenarioCsv(raw: string): CsvRow[] {
  const lines = raw.trim().split('\n');
  if (lines.length < 2) return [];

  const [header, ...rows] = lines;
  const expected = ['date', 'open', 'high', 'low', 'close', 'volume'];
  const cols = header.split(',').map((c) => c.trim().toLowerCase());
  const valid = expected.every((k, i) => cols[i] === k);
  if (!valid) {
    throw new Error('Unexpected CSV schema');
  }

  return rows
    .map((line) => line.split(','))
    .filter((parts) => parts.length >= 6)
    .map((parts) => ({
      date: parts[0],
      open: Number(parts[1]),
      high: Number(parts[2]),
      low: Number(parts[3]),
      close: Number(parts[4]),
      volume: Number(parts[5]),
    }))
    .filter((r) => Number.isFinite(r.close));
}
