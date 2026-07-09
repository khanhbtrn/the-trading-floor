import assert from 'node:assert/strict';
import {
  compliantResizeBonus,
  CONDUCT_COMPLIANT_RESIZE_BONUS,
  CONDUCT_GLITCH_PANIC_PENALTY,
  CONDUCT_OVERRIDE_PENALTY,
  instructionFailsRisk,
} from '../src/lib/sessionRules';
import { normalizeNpcResponse, salvageNpcResponse } from '../src/lib/npc';
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

// Compliance malformed JSON — reason at top level, no reply field
const complianceFix = normalizeNpcResponse({
  action: 'buy',
  sizePosition: 10,
  reason:
    'Hedge event: APPROVED - Manager-certified position limit exception for hedging purposes',
  blocked: false,
  resolvesGlitch: false,
});
assert.ok(complianceFix);
assert.equal(complianceFix!.blocked, false);
assert.equal(
  complianceFix!.reply,
  'Hedge event: APPROVED - Manager-certified position limit exception for hedging purposes'
);
assert.equal(complianceFix!.instruction, null);

const salvaged = salvageNpcResponse(
  '{"reason":"Override granted per policy.","blocked":false,"resolvesGlitch":false}'
);
assert.ok(salvaged);
assert.equal(salvaged!.reply, 'Override granted per policy.');

console.log('verify-game-logic: all checks passed');
