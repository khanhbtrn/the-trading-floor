'use client';

import { motion } from 'framer-motion';
import type { AuditEntry, Rank } from '@/lib/types';
import './ScorecardModal.css';

interface ScorecardModalProps {
  sessionPnL: number;
  careerPnL: number;
  conductScore: number;
  rank: Rank;
  previousRank?: Rank;
  rankIncreased?: boolean;
  scenarioName?: string;
  auditTrail: AuditEntry[];
  persistMessage?: string | null;
  onClose: () => void;
}

export function ScorecardModal({
  sessionPnL,
  careerPnL,
  conductScore,
  rank,
  previousRank,
  rankIncreased = false,
  scenarioName = 'the session',
  auditTrail,
  persistMessage,
  onClose,
}: ScorecardModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <motion.div
        className="scorecard-modal w-full max-w-md rounded border border-cyan-900/50 bg-zinc-950 p-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <h2 className="font-pixel text-sm text-cyan-300">SESSION SCORECARD</h2>
        <p className="mt-1 font-mono text-xs text-zinc-500">
          Session complete — {scenarioName}.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 font-mono text-sm">
          <div className="rounded border border-zinc-800 p-3">
            <p className="text-zinc-500">Session P&amp;L</p>
            <p className={sessionPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              ${sessionPnL.toFixed(2)}
            </p>
          </div>
          <div className="rounded border border-zinc-800 p-3">
            <p className="text-zinc-500">Career P&amp;L</p>
            <p className={careerPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              ${careerPnL.toFixed(2)}
            </p>
          </div>
          <div className="rounded border border-zinc-800 p-3">
            <p className="text-zinc-500">Conduct</p>
            <p className="text-cyan-300">{conductScore}</p>
          </div>
          <div className="rounded border border-zinc-800 p-3">
            <p className="text-zinc-500">Rank</p>
            <p className="font-pixel text-[10px] text-cyan-300">{rank}</p>
          </div>
        </div>

        {rankIncreased && (
          <div className="scorecard-modal__rank-up mt-4 rounded border border-amber-500/40 bg-gradient-to-b from-amber-950/40 to-zinc-950 p-4 text-center">
            <p className="scorecard-modal__rank-up-label font-pixel">RANK UP</p>
            <p className="scorecard-modal__rank-up-rank font-pixel">{rank}</p>
            {previousRank && (
              <p className="mt-1 font-mono text-[10px] text-zinc-500">
                Promoted from {previousRank}
              </p>
            )}
            <p className="mt-2 font-mono text-[10px] text-zinc-500">
              Career milestone reached
            </p>
          </div>
        )}

        {persistMessage && (
          <p className="mt-3 font-mono text-xs text-zinc-500">{persistMessage}</p>
        )}

        <div className="mt-4 max-h-32 overflow-y-auto rounded border border-zinc-800 p-3">
          <p className="font-pixel text-[8px] text-zinc-500">AUDIT TRAIL</p>
          <ul className="mt-2 space-y-1 font-mono text-[10px] text-zinc-400">
            {auditTrail.length === 0 && <li>No entries.</li>}
            {auditTrail.map((entry, i) => (
              <li key={i}>
                <span className="text-cyan-600">{entry.source}</span>
                {entry.action && ` · ${entry.action}`}
                {entry.size != null && ` · ${entry.size}`}
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          className="mt-5 w-full rounded border border-cyan-700 py-2 font-mono text-sm text-cyan-300"
          onClick={onClose}
        >
          Back to Dashboard
        </button>
      </motion.div>
    </div>
  );
}
