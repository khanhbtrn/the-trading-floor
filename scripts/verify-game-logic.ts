import assert from 'node:assert/strict';
import {
  compliantResizeBonus,
  CONDUCT_COMPLIANT_RESIZE_BONUS,
  CONDUCT_GLITCH_PANIC_PENALTY,
  CONDUCT_OVERRIDE_PENALTY,
  instructionFailsRisk,
} from '../src/lib/sessionRules';
import { computeRank } from '../src/lib/rank';
import { MAX_POSITION_PCT_OF_CASH } from '../src/lib/gameReducer';

// Risk gate
assert.equal(instructionFailsRisk({ action: 'buy', sizePctOfCash: 50, reason: 'ok' }), false);
assert.equal(instructionFailsRisk({ action: 'buy', sizePctOfCash: 51, reason: 'big' }), true);
assert.equal(MAX_POSITION_PCT_OF_CASH, 50);

// Compliant resize bonus only after a rejection
assert.equal(
  compliantResizeBonus([], { action: 'buy', sizePctOfCash: 30, reason: 'ok' }),
  0
);
assert.equal(
  compliantResizeBonus(
    [{ source: 'blocked', note: 'rejected' }],
    { action: 'buy', sizePctOfCash: 30, reason: 'ok' }
  ),
  CONDUCT_COMPLIANT_RESIZE_BONUS
);
assert.equal(
  compliantResizeBonus(
    [{ source: 'blocked' }],
    { action: 'buy', sizePctOfCash: 60, reason: 'still big' }
  ),
  0
);

// Rank thresholds
assert.equal(computeRank(1000, 95), 'Desk Head');
assert.equal(computeRank(1000, 80), 'VP');
assert.equal(computeRank(0, 80), 'Associate');
assert.equal(computeRank(-1, 50), 'Junior Trader');

// Conduct constants documented for playthrough QA
assert.equal(CONDUCT_OVERRIDE_PENALTY, 20);
assert.equal(CONDUCT_GLITCH_PANIC_PENALTY, 10);

console.log('verify-game-logic: all checks passed');
