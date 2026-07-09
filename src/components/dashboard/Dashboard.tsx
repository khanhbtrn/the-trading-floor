'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { GameIntroSequence } from '@/components/game-intro';
import { PlayerLogin, PlayerBootScreen } from '@/components/player-login';
import { ScorecardModal } from '@/components/scorecard-modal';
import { AnimatedPnL } from '@/components/animated-pnl';
import { RankUpCelebration } from '@/components/rank-up';
import { FloatingNpcComms } from '@/components/floating-npc-comms';
import type { ChatMessage } from '@/components/npc-chat';
import type { PriceHistoryPoint } from '@/components/trading-desk';
import { TradingDeskView } from '@/components/trading-desk';
import { useGame } from '@/context/GameProvider';
import { parseScenarioCsv } from '@/lib/csv';
import {
  DEFAULT_STARTING_CASH,
  GLITCH_TICK,
  MAX_POSITION_PCT_OF_CASH,
} from '@/lib/gameReducer';
import { requestNpc } from '@/lib/npcClient';
import { usePlayerInit } from '@/hooks/usePlayerInit';
import { computeRank, RANK_ORDER } from '@/lib/rank';
import { getScenarioById, scenarios } from '@/lib/scenarios';
import { endSession, fetchLeaderboard } from '@/lib/sessionApi';
import type { LeaderboardEntry, Rank } from '@/lib/types';
import { useSpeechInput } from '@/lib/useSpeechInput';

const TICK_MS = 1000;
const MANAGER_GREETING =
  'Morning. The tape is unstable. Give me your read before we size this ticket.';
const COMPLIANCE_GREETING =
  'Compliance here. Your instruction breached the desk position limit. Justify this trade.';
const TECH_GREETING =
  'Desk support. Trading feed is frozen — describe what you see on your blotter.';

export function Dashboard() {
  const { state, dispatch } = useGame();

  const {
    playerReady,
    playerLoading,
    playerError,
    handleCreatePlayer,
    needsLogin,
    isBooting,
    needsIntro,
    finishIntro,
    introCompleting,
  } = usePlayerInit();

  const [selectedScenarioId, setSelectedScenarioId] = useState('2008');
  const [tick, setTick] = useState(0);
  const [price, setPrice] = useState(0);
  const [rows, setRows] = useState<ReturnType<typeof parseScenarioCsv>>([]);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const glitchTriggered = useRef(false);

  const [managerMessages, setManagerMessages] = useState<ChatMessage[]>([
    { role: 'npc', text: MANAGER_GREETING },
  ]);
  const [complianceMessages, setComplianceMessages] = useState<ChatMessage[]>([
    { role: 'npc', text: COMPLIANCE_GREETING },
  ]);
  const [techMessages, setTechMessages] = useState<ChatMessage[]>([
    { role: 'npc', text: TECH_GREETING },
  ]);
  const [managerLoading, setManagerLoading] = useState(false);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [techLoading, setTechLoading] = useState(false);
  const [managerUnread, setManagerUnread] = useState(1);
  const [complianceUnread, setComplianceUnread] = useState(1);
  const [techUnread, setTechUnread] = useState(1);
  const [managerUrgent, setManagerUrgent] = useState(false);
  const [overrideGranted, setOverrideGranted] = useState(false);
  const [riskStatus, setRiskStatus] = useState<string | null>(null);
  const [managerError, setManagerError] = useState<string | null>(null);
  const [complianceError, setComplianceError] = useState<string | null>(null);
  const [techError, setTechError] = useState<string | null>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  const [scorecardOpen, setScorecardOpen] = useState(false);
  const [scorecardData, setScorecardData] = useState<{
    sessionPnL: number;
    careerPnL: number;
    conductScore: number;
    rank: Rank;
    auditTrail: typeof state.auditTrail;
    persistMessage: string | null;
  } | null>(null);
  const [endingSession, setEndingSession] = useState(false);
  const [rankUpRank, setRankUpRank] = useState<Rank | null>(null);
  const prevRankRef = useRef(state.rank);

  const scenario = state.currentScenarioId
    ? getScenarioById(state.currentScenarioId)
    : null;

  const loadLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    setLeaderboardError(null);
    const result = await fetchLeaderboard();
    if (result.ok) {
      setLeaderboard(result.entries);
    } else {
      setLeaderboard([]);
      setLeaderboardError(result.error);
    }
    setLeaderboardLoading(false);
  }, []);

  useEffect(() => {
    if (playerReady) {
      void loadLeaderboard();
    }
  }, [playerReady, loadLeaderboard]);

  useEffect(() => {
    if (playerReady && !state.currentScenarioId) {
      const config = getScenarioById(selectedScenarioId);
      if (config && !config.locked) {
        startSession(selectedScenarioId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerReady]);

  const resetNpcChats = () => {
    setManagerMessages([{ role: 'npc', text: MANAGER_GREETING }]);
    setComplianceMessages([{ role: 'npc', text: COMPLIANCE_GREETING }]);
    setTechMessages([{ role: 'npc', text: TECH_GREETING }]);
    setManagerUnread(0);
    setComplianceUnread(0);
    setTechUnread(0);
    setManagerUrgent(false);
    setOverrideGranted(false);
    setRiskStatus(null);
    setManagerError(null);
    setComplianceError(null);
    setTechError(null);
    glitchTriggered.current = false;
  };

  const startSession = (scenarioId: string) => {
    const config = getScenarioById(scenarioId);
    if (!config || config.locked) return;

    dispatch({
      type: 'START_SESSION',
      scenarioId,
      startingCash: DEFAULT_STARTING_CASH,
    });
    setTick(0);
    setPrice(0);
    setRows([]);
    resetNpcChats();
  };

  useEffect(() => {
    if (!state.currentScenarioId || !scenario) return;

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
  }, [state.currentScenarioId, scenario]);

  useEffect(() => {
    if (!rows.length || state.glitchActive || !state.currentScenarioId) return;
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
    rows,
    tick,
    state.glitchActive,
    state.cash,
    state.position.qty,
    state.currentScenarioId,
    dispatch,
  ]);

  useEffect(() => {
    if (
      tick === GLITCH_TICK &&
      !glitchTriggered.current &&
      state.currentScenarioId &&
      rows.length > GLITCH_TICK
    ) {
      glitchTriggered.current = true;
      dispatch({ type: 'PATCH', patch: { glitchActive: true } });
      setTechUnread((c) => c + 1);
      setTechMessages((prev) => [
        ...prev,
        {
          role: 'npc',
          text: 'SYSTEM GLITCH — price feed frozen at tick 20. Run diagnostics.',
        },
      ]);
    }
  }, [tick, state.currentScenarioId, rows.length, dispatch]);

  const evaluateInstruction = useCallback(
    (instruction: NonNullable<typeof state.currentInstruction>) => {
      const failsRisk = instruction.sizePctOfCash > MAX_POSITION_PCT_OF_CASH;
      if (failsRisk) {
        dispatch({ type: 'PATCH', patch: { blocked: true } });
        setRiskStatus('BLOCKED — see Compliance');
        setComplianceUnread((c) => c + 1);
      } else {
        dispatch({ type: 'PATCH', patch: { blocked: false } });
        setRiskStatus('PASS — execute on desk');
      }
    },
    [dispatch]
  );

  const sendManager = useCallback(
    async (text: string) => {
      const userMessage: ChatMessage = { role: 'user', text };
      const nextMessages = [...managerMessages, userMessage];
      setManagerMessages(nextMessages);
      setManagerUnread(0);
      setManagerUrgent(false);
      setManagerLoading(true);
      setManagerError(null);

      try {
        const result = await requestNpc('manager', nextMessages);
        if (!result.ok) {
          setManagerError(result.error);
          return;
        }
        const npc = result.data;
        setManagerMessages((prev) => [...prev, { role: 'npc', text: npc.reply }]);
        setManagerUnread((c) => c + 1);

        if (npc.instruction) {
          dispatch({
            type: 'PATCH',
            patch: { currentInstruction: npc.instruction },
          });
          setManagerUrgent(true);
          evaluateInstruction(npc.instruction);
        }
      } finally {
        setManagerLoading(false);
      }
    },
    [managerMessages, dispatch, evaluateInstruction]
  );

  const sendCompliance = useCallback(
    async (text: string) => {
      const userMessage: ChatMessage = { role: 'user', text };
      const nextMessages = [...complianceMessages, userMessage];
      setComplianceMessages(nextMessages);
      setComplianceUnread(0);
      setComplianceLoading(true);
      setComplianceError(null);

      try {
        const result = await requestNpc('compliance', nextMessages);
        if (!result.ok) {
          setComplianceError(result.error);
          return;
        }
        const npc = result.data;
        setComplianceMessages((prev) => [...prev, { role: 'npc', text: npc.reply }]);
        setComplianceUnread((c) => c + 1);

        if (!npc.blocked) {
          setOverrideGranted(true);
          dispatch({
            type: 'PATCH',
            patch: {
              blocked: false,
              conductScore: Math.max(0, state.conductScore - 20),
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
          setRiskStatus('Override approved — execute on desk');
        } else {
          dispatch({
            type: 'PATCH',
            patch: {
              auditTrail: [
                ...state.auditTrail,
                { source: 'blocked', tick, note: 'Compliance rejected override' },
              ],
            },
          });
        }
      } finally {
        setComplianceLoading(false);
      }
    },
    [complianceMessages, dispatch, state.auditTrail, state.conductScore, tick]
  );

  const sendTech = useCallback(
    async (text: string) => {
      const userMessage: ChatMessage = { role: 'user', text };
      const nextMessages = [...techMessages, userMessage];
      setTechMessages(nextMessages);
      setTechUnread(0);
      setTechLoading(true);
      setTechError(null);

      try {
        const result = await requestNpc('tech', nextMessages);
        if (!result.ok) {
          setTechError(result.error);
          return;
        }
        const npc = result.data;
        setTechMessages((prev) => [...prev, { role: 'npc', text: npc.reply }]);
        setTechUnread((c) => c + 1);

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
        }
      } finally {
        setTechLoading(false);
      }
    },
    [techMessages, dispatch, state.auditTrail, tick]
  );

  const { speechSupported, startListening: startManagerMic } = useSpeechInput((t) =>
    void sendManager(t)
  );
  const { startListening: startComplianceMic } = useSpeechInput((t) =>
    void sendCompliance(t)
  );
  const { startListening: startTechMic } = useSpeechInput((t) => void sendTech(t));

  const tradeUnlocked =
    !!state.currentInstruction && !state.blocked && !state.glitchActive;
  const managerGreyed = state.blocked && !overrideGranted;
  const instructionAction = state.currentInstruction?.action;
  const buyAllowed = tradeUnlocked && instructionAction === 'buy';
  const sellAllowed = tradeUnlocked && instructionAction === 'sell';

  const executeBuy = (size: number) => {
    if (!tradeUnlocked || state.currentInstruction?.action !== 'buy' || size <= 0) {
      if (state.glitchActive && size > 0) {
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
            source: overrideGranted ? 'player-override' : 'ai-instructed',
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
    if (!tradeUnlocked || state.currentInstruction?.action !== 'sell' || size <= 0) {
      if (state.glitchActive && size > 0) {
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
            source: overrideGranted ? 'player-override' : 'ai-instructed',
            action: 'sell',
            size,
            price,
            tick,
          },
        ],
      },
    });
  };

  const handleEndSession = async () => {
    if (!state.currentScenarioId || endingSession) return;
    setEndingSession(true);

    const newCareerPnL = state.careerPnL + state.pnl;
    const newRank = computeRank(newCareerPnL, state.conductScore);
    const newSessionsPlayed = state.sessionsPlayed + 1;
    const snapshot = {
      sessionPnL: state.pnl,
      careerPnL: newCareerPnL,
      conductScore: state.conductScore,
      rank: newRank,
      auditTrail: [...state.auditTrail],
    };

    const result = await endSession({
      playerId: state.playerId,
      scenarioId: state.currentScenarioId,
      sessionPnL: state.pnl,
      conductScore: state.conductScore,
      finalRank: newRank,
      careerPnL: newCareerPnL,
      sessionsPlayed: newSessionsPlayed,
    });

    dispatch({
      type: 'END_SESSION',
      rank: newRank,
      careerPnL: newCareerPnL,
      sessionsPlayed: newSessionsPlayed,
    });

    if (RANK_ORDER[newRank] > RANK_ORDER[prevRankRef.current]) {
      setRankUpRank(newRank);
    }
    prevRankRef.current = newRank;

    setScorecardData({
      ...snapshot,
      persistMessage: result.ok
        ? 'Career progress saved to Supabase.'
        : `Session ended (save failed: ${result.reason})`,
    });
    setScorecardOpen(true);
    setEndingSession(false);
    void loadLeaderboard();
    resetNpcChats();
    setTick(0);
    setPrice(0);
    setRows([]);
  };

  const priceHistory = useMemo<PriceHistoryPoint[]>(
    () =>
      rows.slice(0, tick + 1).map((r) => ({
        date: r.date,
        price: r.close,
      })),
    [rows, tick]
  );

  if (isBooting) {
    return <PlayerBootScreen />;
  }

  if (needsLogin) {
    return (
      <PlayerLogin
        onSubmit={handleCreatePlayer}
        loading={playerLoading}
        error={playerError}
      />
    );
  }

  if (needsIntro) {
    return (
      <GameIntroSequence
        playerName={state.playerName}
        completing={introCompleting}
        onComplete={() => void finishIntro()}
        onSkip={() => void finishIntro()}
      />
    );
  }

  const topBar = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs">
      <span className="text-zinc-300">
        Welcome back, <span className="text-cyan-300">{state.playerName}</span>
      </span>
      <span className="text-zinc-500">|</span>
      <span>
        Rank: <span className="text-cyan-300">{state.rank}</span>
      </span>
      <span className="text-zinc-500">|</span>
      <span>
        Career P&amp;L:{' '}
        <AnimatedPnL
          value={state.careerPnL}
          className={state.careerPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}
        />
      </span>
      {state.glitchActive && (
        <>
          <span className="text-zinc-500">|</span>
          <span className="text-amber-400">GLITCH ACTIVE</span>
        </>
      )}
    </div>
  );

  const leftSidebar = (
    <div className="space-y-4 font-mono text-[11px]">
      <div>
        <p className="text-zinc-300">{state.rank}</p>
        <p className="text-zinc-500">
          Career P&amp;L:{' '}
          <AnimatedPnL value={state.careerPnL} className="text-zinc-400" />
        </p>
        <p className="text-zinc-500">Sessions: {state.sessionsPlayed}</p>
        <p className="text-zinc-500">Conduct: {state.conductScore}</p>
      </div>
      <div>
        <p className="font-pixel text-[8px] text-zinc-500">LEADERBOARD</p>
        {leaderboardLoading && (
          <p className="mt-2 text-zinc-600">Loading…</p>
        )}
        {leaderboardError && !leaderboardLoading && (
          <p className="mt-2 text-red-400">{leaderboardError}</p>
        )}
        {!leaderboardLoading && !leaderboardError && leaderboard.length === 0 && (
          <p className="mt-2 text-zinc-600">No players yet</p>
        )}
        <ul className="mt-2 space-y-1">
          {leaderboard.map((entry, i) => (
            <li key={i} className="text-zinc-400">
              {entry.player_name}
              <br />
              <span className="text-zinc-600">
                {entry.rank} · ${entry.career_pnl.toFixed(0)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const center = (
    <div>
      {!state.currentScenarioId && (
        <p className="mb-4 font-mono text-sm text-zinc-500">
          Select a scenario below to begin a session.
        </p>
      )}
      {csvLoading && (
        <p className="mb-4 font-mono text-sm text-zinc-400">Loading CSV feed…</p>
      )}
      {csvError && (
        <p className="mb-4 font-mono text-sm text-red-400">{csvError}</p>
      )}
      {state.currentScenarioId && !csvLoading && !csvError && rows.length > 0 && (
        <TradingDeskView
          priceHistory={priceHistory}
          position={state.position}
          cash={state.cash}
          pnl={state.pnl}
          disabled={state.glitchActive || !state.currentInstruction}
          buyDisabled={!buyAllowed}
          sellDisabled={!sellAllowed}
          onBuy={executeBuy}
          onSell={executeSell}
        />
      )}
      {state.currentInstruction && (
        <p className="mt-3 font-mono text-[10px] text-zinc-500">
          Active instruction: {state.currentInstruction.action.toUpperCase()}{' '}
          {state.currentInstruction.sizePctOfCash}% —{' '}
          {tradeUnlocked ? 'unlocked' : 'locked'}
        </p>
      )}
    </div>
  );

  const npcCommsItems = [
    {
      persona: 'manager' as const,
      title: 'Manager',
      npcDisplayName: 'Vince Cole',
      messages: managerMessages,
      isLoading: managerLoading,
      disabled: managerGreyed,
      unreadCount: managerUnread,
      isUrgent: managerUrgent,
      statusLine: riskStatus ?? undefined,
      error: managerError,
      showFreeTextInput: !managerGreyed,
      onSend: (text: string) => void sendManager(text),
      onMicPress: speechSupported ? startManagerMic : undefined,
      onClearUnread: () => setManagerUnread(0),
      footerExtra: state.currentInstruction ? (
        <p className="font-mono text-[9px] text-orange-400/80">
          {state.currentInstruction.action.toUpperCase()}{' '}
          {state.currentInstruction.sizePctOfCash}% —{' '}
          {state.currentInstruction.reason}
        </p>
      ) : undefined,
    },
    {
      persona: 'compliance' as const,
      title: 'Compliance',
      messages: complianceMessages,
      isLoading: complianceLoading,
      disabled: !state.blocked,
      highlighted: state.blocked && !overrideGranted,
      unreadCount: complianceUnread,
      error: complianceError,
      showFreeTextInput: state.blocked && !overrideGranted,
      onSend: (text: string) => void sendCompliance(text),
      onMicPress: speechSupported ? startComplianceMic : undefined,
      onClearUnread: () => setComplianceUnread(0),
    },
    {
      persona: 'tech' as const,
      title: 'Tech',
      messages: techMessages,
      isLoading: techLoading,
      highlighted: state.glitchActive,
      unreadCount: techUnread,
      error: techError,
      showFreeTextInput: state.glitchActive,
      onSend: (text: string) => void sendTech(text),
      onMicPress: speechSupported ? startTechMic : undefined,
      onClearUnread: () => setTechUnread(0),
    },
  ];

  const bottomBar = (
    <>
      <label className="flex items-center gap-2 font-mono text-xs text-zinc-400">
        Scenario
        <select
          className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-200"
          value={selectedScenarioId}
          onChange={(e) => {
            const id = e.target.value;
            setSelectedScenarioId(id);
            const config = getScenarioById(id);
            if (config && !config.locked) {
              startSession(id);
            }
          }}
        >
          {scenarios.map((s) => (
            <option key={s.id} value={s.id} disabled={s.locked}>
              {s.displayName}
              {s.locked ? ' (Coming soon)' : ''}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="rounded border border-cyan-700 px-4 py-2 font-mono text-xs text-cyan-300 disabled:opacity-40"
        disabled={!state.currentScenarioId || endingSession}
        onClick={() => void handleEndSession()}
      >
        {endingSession ? 'Saving session…' : 'End Session'}
      </button>
      {endingSession && (
        <span className="font-mono text-[10px] text-zinc-500">Writing to Supabase…</span>
      )}
    </>
  );

  return (
    <>
      <DashboardShell
        topBarContent={topBar}
        leftSidebarContent={leftSidebar}
        centerContent={center}
        bottomBarContent={bottomBar}
        floatingComms
      />
      <FloatingNpcComms npcs={npcCommsItems} />
      {scorecardOpen && scorecardData && (
        <ScorecardModal
          sessionPnL={scorecardData.sessionPnL}
          careerPnL={scorecardData.careerPnL}
          conductScore={scorecardData.conductScore}
          rank={scorecardData.rank}
          auditTrail={scorecardData.auditTrail}
          persistMessage={scorecardData.persistMessage}
          onClose={() => {
            setScorecardOpen(false);
            setScorecardData(null);
          }}
        />
      )}
      <RankUpCelebration
        rank={rankUpRank ?? state.rank}
        show={rankUpRank !== null}
        onDone={() => setRankUpRank(null)}
      />
    </>
  );
}
