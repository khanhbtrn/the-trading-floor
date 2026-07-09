import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TICK_INTERVAL_MS } from '../constants';
import type { GameState } from '../types';
import { ChatUI } from './ChatUI';

interface DeskProps {
  state: GameState;
  onAdvanceTick: () => void;
  onTrade: (action: 'BUY' | 'SELL', size: number) => void;
  onResolveGlitch: (note: string) => void;
  onEndSession: () => void;
}

export function Desk({
  state,
  onAdvanceTick,
  onTrade,
  onResolveGlitch,
  onEndSession,
}: DeskProps) {
  const scenario = state.scenario!;
  const [paused, setPaused] = useState(false);
  const [tradeSize, setTradeSize] = useState(1000);
  const [pendingOrder, setPendingOrder] = useState<{ action: 'BUY' | 'SELL'; size: number } | null>(null);
  const glitchTriggeredRef = useRef(false);
  const atEnd = state.tick >= scenario.priceSeries.length - 1;

  const chartData = scenario.priceSeries.slice(0, state.tick + 1).map((p) => ({
    date: p.date,
    price: p.price,
  }));

  useEffect(() => {
    if (paused || state.glitchActive || atEnd) return;

    const timer = setInterval(() => {
      onAdvanceTick();
    }, TICK_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [paused, state.glitchActive, atEnd, onAdvanceTick, state.tick]);

  useEffect(() => {
    if (
      state.scenario &&
      state.tick === state.scenario.glitch.triggerTick &&
      !glitchTriggeredRef.current
    ) {
      glitchTriggeredRef.current = true;
      setPendingOrder(null);
    }
  }, [state.tick, state.scenario]);

  useEffect(() => {
    if (state.glitchActive) {
      setPendingOrder(null);
    }
  }, [state.glitchActive]);

  const handleTradeClick = (action: 'BUY' | 'SELL') => {
    if (state.glitchActive) return;
    setPendingOrder({ action, size: tradeSize });
  };

  const confirmTrade = useCallback(() => {
    if (!pendingOrder || state.glitchActive) return;
    onTrade(pendingOrder.action, pendingOrder.size);
    setPendingOrder(null);
  }, [pendingOrder, state.glitchActive, onTrade]);

  const cancelPending = () => setPendingOrder(null);

  const handleGlitchResolve = (choice: { label: string }) => {
    onResolveGlitch(`System glitch resolved: ${choice.label}`);
  };

  const techStartId = scenario.techScript[0]?.id ?? '';

  return (
    <div className="screen desk">
      <header className="screen-header desk-header">
        <div>
          <h1>Trading Desk</h1>
          <p className="subtitle">
            {scenario.ticker} — {scenario.priceSeries[state.tick]?.date}
          </p>
        </div>
        <div className="desk-stats">
          <div className="stat">
            <span className="stat-label">Price</span>
            <span className="stat-value">${state.price.toFixed(2)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Position</span>
            <span className="stat-value">{state.position.toLocaleString()}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Cash</span>
            <span className="stat-value">${state.cash.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="stat">
            <span className="stat-label">P&amp;L</span>
            <span className={`stat-value ${state.pnl >= 0 ? 'positive' : 'negative'}`}>
              ${state.pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Conduct</span>
            <span className="stat-value">{state.conductScore}</span>
          </div>
        </div>
      </header>

      {state.currentInstruction && (
        <div className="desk-instruction">
          <strong>Active instruction:</strong> {state.currentInstruction.text}
        </div>
      )}

      <div className="desk-main">
        <div className="chart-panel">
          <div className="chart-controls">
            <button
              className="btn btn-secondary"
              onClick={() => setPaused((p) => !p)}
              disabled={state.glitchActive}
            >
              {paused ? '▶ Play' : '⏸ Pause'}
            </button>
            <span className="tick-indicator">
              Tick {state.tick + 1} / {scenario.priceSeries.length}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" tick={{ fill: '#aaa', fontSize: 11 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: '#aaa', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid #444' }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#4fc3f7"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="trade-panel">
          <h3>Execute Trade</h3>
          <label className="trade-size-label">
            Size (shares)
            <input
              type="number"
              min={1}
              step={100}
              value={tradeSize}
              onChange={(e) => setTradeSize(Math.max(1, Number(e.target.value)))}
              disabled={state.glitchActive}
            />
          </label>
          <div className="trade-buttons">
            <button
              className="btn btn-buy"
              onClick={() => handleTradeClick('BUY')}
              disabled={state.glitchActive}
            >
              Buy
            </button>
            <button
              className="btn btn-sell"
              onClick={() => handleTradeClick('SELL')}
              disabled={state.glitchActive || state.position <= 0}
            >
              Sell
            </button>
          </div>

          {pendingOrder && !state.glitchActive && (
            <div className="pending-order">
              <p>
                Confirm {pendingOrder.action} {pendingOrder.size.toLocaleString()} @ $
                {state.price.toFixed(2)}?
              </p>
              <div className="pending-actions">
                <button className="btn btn-primary" onClick={confirmTrade}>
                  Confirm
                </button>
                <button className="btn btn-secondary" onClick={cancelPending}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {atEnd && (
        <div className="desk-end">
          <p>Price series complete.</p>
          <button className="btn btn-primary" onClick={onEndSession}>
            End Session
          </button>
        </div>
      )}

      {state.glitchActive && (
        <div className="modal-overlay">
          <div className="modal glitch-modal">
            <header className="modal-header">
              <h2>⚠ System Glitch</h2>
              <p>{scenario.glitch.description}</p>
            </header>
            <ChatUI
              script={scenario.techScript}
              startNodeId={techStartId}
              onResolve={(choice) => handleGlitchResolve(choice)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
