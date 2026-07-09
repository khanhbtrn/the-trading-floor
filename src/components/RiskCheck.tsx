import { useMemo } from 'react';
import { POSITION_SIZE_LIMIT } from '../constants';
import type { GameState } from '../types';

interface RiskCheckProps {
  state: GameState;
  onContinue: () => void;
}

function formatViolation(ruleId: string, state: GameState): string {
  const instr = state.currentInstruction!;
  switch (ruleId) {
    case 'position-size-limit':
      return `Position limit exceeded: instruction requests ${instr.targetSize.toLocaleString()} shares, limit is ${POSITION_SIZE_LIMIT.toLocaleString()}`;
    case 'restricted-list':
      return `Restricted list violation: ${instr.ticker} is on the firm restricted list`;
    case 'short-down-day':
      return 'Short-selling restriction: cannot initiate short position on a down day';
    default:
      return 'Risk rule violation detected';
  }
}

export function RiskCheck({ state, onContinue }: RiskCheckProps) {
  const { passed, violations } = useMemo(() => {
    if (!state.currentInstruction || !state.scenario) {
      return { passed: true, violations: [] as string[] };
    }

    const tripped = state.scenario.riskRules.filter((rule) =>
      rule.check(state.currentInstruction!, state)
    );

    return {
      passed: tripped.length === 0,
      violations: tripped.map((rule) => formatViolation(rule.id, state)),
    };
  }, [state]);

  return (
    <div className="screen risk-check">
      <header className="screen-header">
        <h1>Risk Check</h1>
        <p className="subtitle">Automated pre-trade compliance scan</p>
      </header>

      <div className={`risk-result ${passed ? 'pass' : 'blocked'}`}>
        <span className="risk-status">{passed ? 'PASS' : 'BLOCKED'}</span>
      </div>

      {state.currentInstruction && (
        <div className="risk-instruction">
          <h3>Instruction Under Review</h3>
          <p>{state.currentInstruction.text}</p>
          <p className="risk-detail">
            {state.currentInstruction.action} {state.currentInstruction.targetSize.toLocaleString()}{' '}
            {state.currentInstruction.ticker}
          </p>
        </div>
      )}

      {!passed && (
        <ul className="risk-violations">
          {violations.map((v, i) => (
            <li key={i}>{v}</li>
          ))}
        </ul>
      )}

      {passed && (
        <p className="risk-clear">All risk rules passed. Proceed to the trading desk.</p>
      )}

      <button className="btn btn-primary" onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}
