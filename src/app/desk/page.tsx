'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageShell } from '@/components/PageShell';
import { useGame } from '@/context/GameProvider';
import { getScenarioById } from '@/lib/scenarios';
import type { PriceHistoryPoint } from '@/components/trading-desk';
import { TradingDeskView } from '@/components/trading-desk';

interface CsvRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const TICK_MS = 1000;
const DEFAULT_STARTING_CASH = 100_000;

export default function DeskPage() {
  const { state, dispatch } = useGame();
  const scenario = state.scenarioId ? getScenarioById(state.scenarioId) : null;
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scenario) return;
    let active = true;
    setLoading(true);
    setError(null);

    fetch(scenario.csvPath)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`CSV fetch failed: ${res.status}`);
        }
        return res.text();
      })
      .then((raw) => {
        if (!active) return;
        const parsed = parseCsv(raw);
        if (!parsed.length) {
          throw new Error('CSV was empty');
        }
        setRows(parsed);
        dispatch({
          type: 'PATCH',
          patch: {
            tick: 0,
            price: parsed[0].close,
          },
        });
      })
      .catch((e) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : 'Failed to load CSV');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [scenario, dispatch]);

  useEffect(() => {
    if (!rows.length || state.glitchActive) return;
    if (state.tick >= rows.length - 1) return;

    const timer = setTimeout(() => {
      const nextTick = Math.min(state.tick + 1, rows.length - 1);
      const nextPrice = rows[nextTick].close;
      const nextPnl = state.cash + state.position.qty * nextPrice - DEFAULT_STARTING_CASH;
      dispatch({
        type: 'PATCH',
        patch: {
          tick: nextTick,
          price: nextPrice,
          pnl: nextPnl,
        },
      });
    }, TICK_MS);

    return () => clearTimeout(timer);
  }, [rows, state.tick, state.glitchActive, state.cash, state.position.qty, dispatch]);

  const priceHistory = useMemo<PriceHistoryPoint[]>(
    () =>
      rows.slice(0, state.tick + 1).map((r) => ({
        date: r.date,
        price: r.close,
      })),
    [rows, state.tick]
  );

  const executeBuy = (size: number) => {
    if (state.glitchActive || size <= 0) return;
    const tradeValue = size * state.price;
    if (tradeValue > state.cash) return;

    const oldQty = state.position.qty;
    const oldAvg = state.position.avgPrice;
    const newQty = oldQty + size;
    const newAvg =
      newQty === 0
        ? 0
        : (oldQty * oldAvg + size * state.price) / newQty;
    const newCash = state.cash - tradeValue;
    const newPnl =
      newCash + newQty * state.price - DEFAULT_STARTING_CASH;

    dispatch({
      type: 'PATCH',
      patch: {
        position: { qty: newQty, avgPrice: newAvg },
        cash: newCash,
        pnl: newPnl,
      },
    });
  };

  const executeSell = (size: number) => {
    if (state.glitchActive || size <= 0) return;
    if (size > state.position.qty) return;

    const newQty = state.position.qty - size;
    const newCash = state.cash + size * state.price;
    const newPnl =
      newCash + newQty * state.price - DEFAULT_STARTING_CASH;

    dispatch({
      type: 'PATCH',
      patch: {
        position: {
          qty: newQty,
          avgPrice: newQty === 0 ? 0 : state.position.avgPrice,
        },
        cash: newCash,
        pnl: newPnl,
      },
    });
  };

  if (!scenario) {
    return (
      <PageShell title="TRADING DESK" subtitle="Live price feed + order ticket">
        <p className="font-mono text-sm text-zinc-400">
          Select a scenario first on /select.
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell title="TRADING DESK" subtitle={`${scenario.displayName} — ${scenario.ticker}`}>
      {loading && (
        <p className="mb-4 font-mono text-sm text-zinc-400">Loading CSV feed…</p>
      )}
      {error && (
        <p className="mb-4 font-mono text-sm text-red-400">{error}</p>
      )}
      {!loading && !error && rows.length > 0 && (
        <TradingDeskView
          priceHistory={priceHistory}
          position={state.position}
          cash={state.cash}
          pnl={state.pnl}
          disabled={state.glitchActive}
          onBuy={executeBuy}
          onSell={executeSell}
        />
      )}
      {state.glitchActive && (
        <p className="mt-4 font-pixel text-[10px] text-amber-400">
          GLITCH ACTIVE — trading paused
        </p>
      )}
    </PageShell>
  );
}

function parseCsv(raw: string): CsvRow[] {
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
