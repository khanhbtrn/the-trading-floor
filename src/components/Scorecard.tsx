import { computeFinalScore } from '../utils/rank';
import type { GameState } from '../types';
import { AuditTable } from './AuditTable';

interface ScorecardProps {
  state: GameState;
  onReset: () => void;
}

export function Scorecard({ state, onReset }: ScorecardProps) {
  const finalScore = computeFinalScore(state.pnl, state.conductScore);

  return (
    <div className="screen scorecard">
      <header className="screen-header">
        <h1>Session Scorecard</h1>
        <p className="subtitle">{state.scenario?.name}</p>
      </header>

      <div className="scorecard-summary">
        <div className="scorecard-metric">
          <span className="metric-label">Final P&amp;L</span>
          <span className={`metric-value ${state.pnl >= 0 ? 'positive' : 'negative'}`}>
            ${state.pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="scorecard-metric">
          <span className="metric-label">Conduct Score</span>
          <span className="metric-value">{state.conductScore}</span>
        </div>
        <div className="scorecard-metric">
          <span className="metric-label">Composite Score</span>
          <span className="metric-value">{finalScore.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="scorecard-rank">
          <span className="metric-label">Rank</span>
          <span className="rank-badge">{state.rank}</span>
        </div>
      </div>

      <section className="audit-section">
        <h2>Audit Trail</h2>
        <AuditTable entries={state.auditTrail} />
      </section>

      <button className="btn btn-primary" onClick={onReset}>
        Return to Scenario Select
      </button>
    </div>
  );
}
