'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageShell } from '@/components/PageShell';
import { NpcChatView, type ChatMessage } from '@/components/npc-chat';
import type { PriceHistoryPoint } from '@/components/trading-desk';
import { TradingDeskView } from '@/components/trading-desk';
import { useGame } from '@/context/GameProvider';
import { parseScenarioCsv } from '@/lib/csv';
import { DEFAULT_STARTING_CASH } from '@/lib/gameReducer';
import { requestNpc } from '@/lib/npcClient';
import { persistPlayerSession } from '@/lib/persistPlayer';
import { computeRank } from '@/lib/rank';
import { getScenarioById, scenarios } from '@/lib/scenarios';
import type { TradeInstruction } from '@/lib/types';
import { useSpeechInput } from '@/lib/useSpeechInput';

const TICK_MS = 1000;
const MAX_POSITION_PCT = 50;

type Phase =
  | 'lobby'
  | 'briefing'
  | 'risk-check'
  | 'escalation'
  | 'desk'
  | 'scorecard';

export function Dashboard() {
  const { state, dispatch } = useGame();
  const [phase, setPhase] = useState<Phase>('lobby');
  const [nameInput, setNameInput] = useState(state.playerName);
  const [currentInstruction, setCurrentInstruction] =
    useState<TradeInstruction | null>(null);
  const [riskBlocked, setRiskBlocked] = useState(false);
  const [tick, setTick] = useState(0);
  const [price, setPrice] = useState(0);
  const [rows, setRows] = useState<ReturnType<typeof parseScenarioCsv>>([]);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [persistStatus, setPersistStatus] = useState<string | null>(null);
  const [lastSession, setLastSession] = useState<{
    sessionPnL: number;
    careerPnL: number;
    conductScore: number;
    rank: string;
    auditTrail: typeof state.auditTrail;
  } | null>(null);

  const [briefingMessages, setBriefingMessages] = useState<ChatMessage[]>([
    {
      role: 'npc',
      text: 'Morning. The tape is unstable. Give me your read before we size this ticket.',
    },
  ]);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [instructionIssued, setInstructionIssued] = useState(false);

  const [escalationMessages, setEscalationMessages] = useState<ChatMessage[]>([
    {
      role: 'npc',
      text: 'Compliance here. Your instruction breached the desk position limit. Justify this trade.',
    },
  ]);
  const [escalationLoading, setEscalationLoading] = useState(false);
  const [escalationResolved, setEscalationResolved] = useState(false);

  const [techMessages, setTechMessages] = useState<ChatMessage[]>([
    {
      role: 'npc',
      text: 'Desk support. Trading feed is frozen — describe what you see on your blotter.',
    },
  ]);
  const [techLoading, setTechLoading] = useState(false);
  const [showTechOverlay, setShowTechOverlay] = useState(false);

  const scenario = state.currentScenarioId
    ? getScenarioById(state.currentScenarioId)
    : null;

  useEffect(() => {
    setNameInput(state.playerName);
  }, [state.playerName]);

  const startScenario = (scenarioId: string) => {
    dispatch({
      type: 'START_SESSION',
      scenarioId,
      startingCash: DEFAULT_STARTING_CASH,
    });
    setCurrentInstruction(null);
    setRiskBlocked(false);
    setTick(0);
    setPrice(0);
    setRows([]);
    setInstructionIssued(false);
    setEscalationResolved(false);
    setShowTechOverlay(false);
    setPersistStatus(null);
    setBriefingMessages([
      {
        role: 'npc',
        text: 'Morning. The tape is unstable. Give me your read before we size this ticket.',
      },
    ]);
    setEscalationMessages([
      {
        role: 'npc',
        text: 'Compliance here. Your instruction breached the desk position limit. Justify this trade.',
      },
    ]);
    setTechMessages([
      {
        role: 'npc',
        text: 'Desk support. Trading feed is frozen — describe what you see on your blotter.',
      },
    ]);
    setPhase('briefing');
  };

  useEffect(() => {
    if (phase !== 'desk' || !scenario) return;
    let active = true;
    setCsvLoading(true);
    setCsvError(null);

    fetch(scenario.csvPath)
      .then(async (res) => {
        if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);
        return res.text();
      })
      .then((raw) => {
        if (!active) return;
        const parsed = parseScenarioCsv(raw);
        if (!parsed.length) throw new Error('CSV was empty');
        setRows(parsed);
        setTick(0);
        setPrice(parsed[0].close);
      })
      .catch((e) => {
        if (!active) return;
        setCsvError(e instanceof Error ? e.message : 'Failed to load CSV');
      })
      .finally(() => {
        if (active) setCsvLoading(false);
      });

    return () => {
      active = false;
    };
  }, [phase, scenario]);

  useEffect(() => {
    if (phase !== 'desk' || !rows.length || state.glitchActive) return;
    if (tick >= rows.length - 1) return;

    const timer = setTimeout(() => {
      const nextTick = Math.min(tick + 1, rows.length - 1);
      const nextPrice = rows[nextTick].close;
      const nextPnl =
        state.cash + state.position.qty * nextPrice - DEFAULT_STARTING_CASH;
      setTick(nextTick);
      setPrice(nextPrice);
      dispatch({
        type: 'PATCH',
        patch: { pnl: nextPnl, sessionPnL: nextPnl },
      });
    }, TICK_MS);

    return () => clearTimeout(timer);
  }, [
    phase,
    rows,
    tick,
    state.glitchActive,
    state.cash,
    state.position.qty,
    dispatch,
  ]);

  const sendBriefing = useCallback(
    async (text: string) => {
      const userMessage: ChatMessage = { role: 'user', text };
      const nextMessages = [...briefingMessages, userMessage];
      setBriefingMessages(nextMessages);
      setBriefingLoading(true);

      try {
        const npc = await requestNpc('manager', nextMessages);
        setBriefingMessages((prev) => [...prev, { role: 'npc', text: npc.reply }]);
        if (npc.instruction) {
          setCurrentInstruction(npc.instruction);
          setInstructionIssued(true);
        }
      } finally {
        setBriefingLoading(false);
      }
    },
    [briefingMessages]
  );

  const sendEscalation = useCallback(
    async (text: string) => {
      const userMessage: ChatMessage = { role: 'user', text };
      const nextMessages = [...escalationMessages, userMessage];
      setEscalationMessages(nextMessages);
      setEscalationLoading(true);

      try {
        const npc = await requestNpc('compliance', nextMessages);
        setEscalationMessages((prev) => [...prev, { role: 'npc', text: npc.reply }]);

        if (!npc.blocked) {
          setEscalationResolved(true);
          setRiskBlocked(false);
          dispatch({
            type: 'PATCH',
            patch: {
              auditTrail: [
                ...state.auditTrail,
                {
                  source: 'player-override',
                  tick,
                  note: 'Compliance override granted',
                },
              ],
            },
          });
        }
      } finally {
        setEscalationLoading(false);
      }
    },
    [escalationMessages, dispatch, state.auditTrail, tick]
  );

  const sendTech = useCallback(
    async (text: string) => {
      const userMessage: ChatMessage = { role: 'user', text };
      const nextMessages = [...techMessages, userMessage];
      setTechMessages(nextMessages);
      setTechLoading(true);

      try {
        const npc = await requestNpc('tech', nextMessages);
        setTechMessages((prev) => [...prev, { role: 'npc', text: npc.reply }]);

        if (npc.resolvesGlitch) {
          dispatch({
            type: 'PATCH',
            patch: {
              glitchActive: false,
              auditTrail: [
                ...state.auditTrail,
                { source: 'glitch', resolved: true, tick },
              ],
            },
          });
          setShowTechOverlay(false);
        }
      } finally {
        setTechLoading(false);
      }
    },
    [techMessages, dispatch, state.auditTrail, tick]
  );

  const { speechSupported, startListening: startBriefingMic } =
    useSpeechInput((t) => void sendBriefing(t));
  const { startListening: startEscalationMic } = useSpeechInput((t) =>
    void sendEscalation(t)
  );
  const { startListening: startTechMic } = useSpeechInput((t) => void sendTech(t));

  const proceedFromBriefing = () => {
    if (!currentInstruction) return;
    const blocked = currentInstruction.sizePctOfCash > MAX_POSITION_PCT;
    setRiskBlocked(blocked);
    setPhase('risk-check');
  };

  const proceedFromRiskCheck = () => {
    if (riskBlocked) {
      setPhase('escalation');
    } else {
      setPhase('desk');
    }
  };

  const proceedFromEscalation = () => {
    setPhase('desk');
  };

  const endSession = useCallback(async () => {
    const sessionRank = computeRank(state.pnl, state.conductScore);
    const newCareerPnL = state.careerPnL + state.pnl;

    setLastSession({
      sessionPnL: state.pnl,
      careerPnL: newCareerPnL,
      conductScore: state.conductScore,
      rank: sessionRank,
      auditTrail: [...state.auditTrail],
    });

    dispatch({
      type: 'END_SESSION',
      sessionPnL: state.pnl,
      rank: sessionRank,
      careerPnL: newCareerPnL,
    });

    const result = await persistPlayerSession(
      state.playerId,
      sessionRank,
      newCareerPnL
    );

    setPersistStatus(
      result.persisted
        ? 'Career progress saved.'
        : `Session ended (save skipped: ${result.reason ?? 'unknown'})`
    );
    setPhase('scorecard');
  }, [state, dispatch]);

  const priceHistory = useMemo<PriceHistoryPoint[]>(
    () =>
      rows.slice(0, tick + 1).map((r) => ({
        date: r.date,
        price: r.close,
      })),
    [rows, tick]
  );

  const executeBuy = (size: number) => {
    if (state.glitchActive || size <= 0) {
      if (state.glitchActive) {
        dispatch({
          type: 'PATCH',
          patch: {
            auditTrail: [
              ...state.auditTrail,
              { source: 'glitch-panic', tick, action: 'buy', size },
            ],
          },
        });
      }
      return;
    }
    const tradeValue = size * price;
    if (tradeValue > state.cash) return;

    const oldQty = state.position.qty;
    const oldAvg = state.position.avgPrice;
    const newQty = oldQty + size;
    const newAvg =
      newQty === 0 ? 0 : (oldQty * oldAvg + size * price) / newQty;
    const newCash = state.cash - tradeValue;
    const newPnl = newCash + newQty * price - DEFAULT_STARTING_CASH;

    dispatch({
      type: 'PATCH',
      patch: {
        position: { qty: newQty, avgPrice: newAvg },
        cash: newCash,
        pnl: newPnl,
        sessionPnL: newPnl,
        auditTrail: [
          ...state.auditTrail,
          {
            source: riskBlocked && escalationResolved ? 'player-override' : 'ai-instructed',
            action: 'buy',
            size,
            price,
            tick,
          },
        ],
      },
    });
  };

  const executeSell = (size: number) => {
    if (state.glitchActive || size <= 0) {
      if (state.glitchActive) {
        dispatch({
          type: 'PATCH',
          patch: {
            auditTrail: [
              ...state.auditTrail,
              { source: 'glitch-panic', tick, action: 'sell', size },
            ],
          },
        });
      }
      return;
    }
    if (size > state.position.qty) return;

    const newQty = state.position.qty - size;
    const newCash = state.cash + size * price;
    const newPnl = newCash + newQty * price - DEFAULT_STARTING_CASH;

    dispatch({
      type: 'PATCH',
      patch: {
        position: {
          qty: newQty,
          avgPrice: newQty === 0 ? 0 : state.position.avgPrice,
        },
        cash: newCash,
        pnl: newPnl,
        sessionPnL: newPnl,
        auditTrail: [
          ...state.auditTrail,
          {
            source: riskBlocked && escalationResolved ? 'player-override' : 'ai-instructed',
            action: 'sell',
            size,
            price,
            tick,
          },
        ],
      },
    });
  };

  const sessionComplete = rows.length > 0 && tick >= rows.length - 1;

  const headerSubtitle = useMemo(() => {
    const parts = [
      state.playerName,
      state.rank,
      scenario ? `${scenario.ticker} — ${scenario.dateRange}` : null,
    ].filter(Boolean);
    return parts.join(' · ');
  }, [state.playerName, state.rank, scenario]);

  return (
    <PageShell title="TRADING FLOOR // 2008" subtitle={headerSubtitle}>
      <div className="mb-6 flex flex-wrap gap-3 font-mono text-xs text-zinc-500">
        <span>Career P&amp;L: ${state.careerPnL.toFixed(2)}</span>
        <span>Session P&amp;L: ${state.sessionPnL.toFixed(2)}</span>
        <span>Conduct: {state.conductScore}</span>
        {state.glitchActive && (
          <span className="text-amber-400">GLITCH ACTIVE</span>
        )}
      </div>

      {phase === 'lobby' && (
        <section className="space-y-6">
          <div className="rounded border border-zinc-800 p-4">
            <label className="font-mono text-xs text-zinc-500">Trader name</label>
            <input
              className="mt-2 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-200"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={() =>
                dispatch({
                  type: 'PATCH',
                  patch: { playerName: nameInput.trim() || 'Trader' },
                })
              }
            />
          </div>

          <ul className="space-y-4">
            {scenarios.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="w-full rounded border border-cyan-800/50 bg-zinc-900/60 p-5 text-left transition hover:border-cyan-500/60 hover:bg-zinc-900"
                  onClick={() => startScenario(s.id)}
                >
                  <p className="font-pixel text-[10px] text-cyan-300">
                    {s.displayName}
                  </p>
                  <p className="mt-2 font-mono text-sm text-zinc-300">
                    {s.ticker} — {s.dateRange}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {phase === 'briefing' && scenario && (
        <NpcChatView
          messages={briefingMessages}
          npcName="Manager"
          isLoading={briefingLoading}
          showFreeTextInput={!instructionIssued}
          onSend={(text) => void sendBriefing(text)}
          onMicPress={speechSupported ? startBriefingMic : undefined}
          instructionPreview={
            currentInstruction
              ? `${currentInstruction.action.toUpperCase()} ${currentInstruction.sizePctOfCash}% cash (${currentInstruction.reason})`
              : undefined
          }
          onProceed={currentInstruction ? proceedFromBriefing : undefined}
          proceedLabel="Proceed to Risk Check"
        />
      )}

      {phase === 'risk-check' && (
        <section>
          <div
            className={`rounded border p-8 text-center font-pixel text-lg ${
              riskBlocked
                ? 'border-red-500/60 bg-red-950/30 text-red-400'
                : 'border-emerald-500/60 bg-emerald-950/30 text-emerald-400'
            }`}
          >
            {riskBlocked ? 'BLOCKED' : 'PASS'}
          </div>
          <p className="mt-4 font-mono text-sm text-zinc-400">
            {riskBlocked
              ? 'Position would exceed 50% of capital — escalation required.'
              : 'Instruction within desk limits.'}
          </p>
          <button
            type="button"
            className="mt-6 rounded border border-cyan-700 px-4 py-2 font-mono text-sm text-cyan-300 hover:bg-cyan-950/40"
            onClick={proceedFromRiskCheck}
          >
            {riskBlocked ? 'Open Compliance Chat' : 'Open Trading Desk'}
          </button>
        </section>
      )}

      {phase === 'escalation' && (
        <NpcChatView
          messages={escalationMessages}
          npcName="Compliance"
          isLoading={escalationLoading}
          showFreeTextInput={!escalationResolved}
          onSend={(text) => void sendEscalation(text)}
          onMicPress={speechSupported ? startEscalationMic : undefined}
          instructionPreview={
            escalationResolved ? 'Override approved. Proceed to desk.' : undefined
          }
          onProceed={escalationResolved ? proceedFromEscalation : undefined}
          proceedLabel="Open Trading Desk"
        />
      )}

      {phase === 'desk' && scenario && (
        <section className="relative">
          {csvLoading && (
            <p className="mb-4 font-mono text-sm text-zinc-400">Loading CSV feed…</p>
          )}
          {csvError && (
            <p className="mb-4 font-mono text-sm text-red-400">{csvError}</p>
          )}
          {!csvLoading && !csvError && rows.length > 0 && (
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

          {sessionComplete && (
            <button
              type="button"
              className="mt-6 w-full rounded border border-cyan-700 py-3 font-mono text-sm text-cyan-300 hover:bg-cyan-950/40"
              onClick={() => void endSession()}
            >
              End Session → Scorecard
            </button>
          )}

          {showTechOverlay && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
              <div className="w-full max-w-lg">
                <NpcChatView
                  messages={techMessages}
                  npcName="Tech Support"
                  isLoading={techLoading}
                  showFreeTextInput
                  onSend={(text) => void sendTech(text)}
                  onMicPress={speechSupported ? startTechMic : undefined}
                />
              </div>
            </div>
          )}
        </section>
      )}

      {phase === 'scorecard' && lastSession && (
        <section>
          <div className="grid grid-cols-2 gap-4 font-mono text-sm">
            <div className="rounded border border-zinc-800 p-4">
              <p className="text-zinc-500">Session P&amp;L</p>
              <p
                className={
                  lastSession.sessionPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
                }
              >
                ${lastSession.sessionPnL.toFixed(2)}
              </p>
            </div>
            <div className="rounded border border-zinc-800 p-4">
              <p className="text-zinc-500">Career P&amp;L</p>
              <p
                className={
                  lastSession.careerPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
                }
              >
                ${lastSession.careerPnL.toFixed(2)}
              </p>
            </div>
            <div className="rounded border border-zinc-800 p-4">
              <p className="text-zinc-500">Conduct</p>
              <p className="text-cyan-300">{lastSession.conductScore}</p>
            </div>
            <div className="rounded border border-zinc-800 p-4">
              <p className="text-zinc-500">Rank</p>
              <p className="font-pixel text-[10px] text-cyan-300">
                {lastSession.rank}
              </p>
            </div>
          </div>

          {persistStatus && (
            <p className="mt-4 font-mono text-xs text-zinc-500">{persistStatus}</p>
          )}

          <div className="mt-6 rounded border border-zinc-800 p-4">
            <p className="font-pixel text-[10px] text-zinc-500">AUDIT TRAIL</p>
            <ul className="mt-3 space-y-2 font-mono text-xs text-zinc-400">
              {lastSession.auditTrail.length === 0 && <li>No entries.</li>}
              {lastSession.auditTrail.map((entry, i) => (
                <li key={i} className="rounded bg-zinc-900/60 px-2 py-1">
                  <span className="text-cyan-600">{entry.source}</span>
                  {entry.action && ` · ${entry.action}`}
                  {entry.size != null && ` · size ${entry.size}`}
                  {entry.note && ` · ${entry.note}`}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-6 font-mono text-xs text-zinc-500">
            You just traded through the week Lehman Brothers collapsed.
          </p>

          <button
            type="button"
            className="mt-6 w-full rounded border border-cyan-700 py-3 font-mono text-sm text-cyan-300 hover:bg-cyan-950/40"
            onClick={() => setPhase('lobby')}
          >
            Return to Lobby
          </button>
        </section>
      )}
    </PageShell>
  );
}
