'use client';

import { useEffect, useRef, useState } from 'react';
import { TICK_INTERVAL_MS } from '@/lib/constants';
import type { GameState } from '@/lib/types';
import { ChatUI } from './ChatUI';
import { TradingDeskView } from './trading-desk';

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
  const glitchTriggeredRef = useRef(false);
  const atEnd = state.tick >= scenario.priceSeries.length - 1;

  const priceHistory = scenario.priceSeries.slice(0, state.tick + 1).map((p) => ({
    date: p.date,
    price: p.price,
  }));

  const avgPrice =
    state.position > 0
      ? (scenario.startingCash - state.cash) / state.position
      : 0;

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
    }
  }, [state.tick, state.scenario]);

  const handleGlitchResolve = (choice: { label: string }) => {
    onResolveGlitch(`System glitch resolved: ${choice.label}`);
  };

  const techStartId = scenario.techScript[0]?.id ?? '';

  return (
    <div className="screen desk">
      <div className="tdv-controls-bar">
        <button
          className="btn btn-secondary"
          onClick={() => setPaused((p) => !p)}
          disabled={state.glitchActive}
        >
          {paused ? '▶ Play' : '⏸ Pause'}
        </button>
        <span className="tick-indicator tdv-mono">
          {scenario.ticker} — {scenario.priceSeries[state.tick]?.date} — Tick{' '}
          {state.tick + 1} / {scenario.priceSeries.length}
        </span>
        <span className="tdv-mono" style={{ fontSize: 12, color: '#71717a' }}>
          Conduct: {state.conductScore}
        </span>
      </div>

      {state.currentInstruction && (
        <div className="tdv-instruction-banner">
          <strong>Active instruction:</strong> {state.currentInstruction.text}
        </div>
      )}

      <TradingDeskView
        priceHistory={priceHistory}
        position={{ qty: state.position, avgPrice }}
        cash={state.cash}
        pnl={state.pnl}
        disabled={state.glitchActive}
        onBuy={(size) => onTrade('BUY', size)}
        onSell={(size) => onTrade('SELL', size)}
      />

      {atEnd && (
        <div className="tdv-end-bar">
          <p style={{ marginBottom: 12, color: '#71717a' }}>Price series complete.</p>
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
