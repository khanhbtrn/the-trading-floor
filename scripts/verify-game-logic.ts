import assert from 'node:assert/strict';
import {
  compliantResizeBonus,
  CONDUCT_COMPLIANT_RESIZE_BONUS,
  CONDUCT_GLITCH_PANIC_PENALTY,
  CONDUCT_ORDER_EXPIRED,
  CONDUCT_OVERRIDE_PENALTY,
  instructionFailsRisk,
} from '../src/lib/sessionRules';
import { normalizeNpcResponse, salvageNpcResponse, clampPersonaReply } from '../src/lib/npc';
import { computeRank } from '../src/lib/rank';
import { MAX_POSITION_PCT_OF_CASH } from '../src/lib/gameReducer';
import { instructionToShareSize } from '../src/lib/tradeSizing';
import { playerAnswerResolvesGlitch } from '../src/lib/glitchResolution';
import { describeTradeLockReason } from '../src/lib/tradeLockReason';

// Risk gate
assert.equal(instructionFailsRisk({ action: 'buy', sizePctOfCash: 50, reason: 'ok' }), false);
assert.equal(instructionFailsRisk({ action: 'buy', sizePctOfCash: 51, reason: 'big' }), true);
assert.equal(MAX_POSITION_PCT_OF_CASH, 50);

// Share sizing from % of cash
assert.equal(
  instructionToShareSize(
    { action: 'buy', sizePctOfCash: 50, reason: 'ok' },
    100_000,
    100
  ),
  500
);

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

// Rank thresholds (2008-tuned)
assert.equal(computeRank(0, 100), 'Junior Trader');
assert.equal(computeRank(2_499, 100), 'Junior Trader');
assert.equal(computeRank(2_500, 70), 'Associate');
assert.equal(computeRank(0, 100, 3), 'Associate');
assert.equal(computeRank(2_499, 80), 'Junior Trader');
assert.equal(computeRank(9_999, 80), 'Associate');
assert.equal(computeRank(10_000, 80), 'VP');
assert.equal(computeRank(0, 75, 6), 'VP');
assert.equal(computeRank(24_999, 90), 'VP');
assert.equal(computeRank(25_000, 90), 'Desk Head');
assert.equal(computeRank(0, 85, 12), 'Desk Head');
assert.equal(computeRank(-1, 50), 'Junior Trader');

// Conduct constants documented for playthrough QA
assert.equal(CONDUCT_OVERRIDE_PENALTY, 20);
assert.equal(CONDUCT_GLITCH_PANIC_PENALTY, 10);
assert.equal(CONDUCT_ORDER_EXPIRED, -5);

// Glitch resolution heuristic
assert.equal(
  playerAnswerResolvesGlitch(
    'Last price is 95.42, chart frozen at 20 points, position flat.'
  ),
  true
);
assert.equal(playerAnswerResolvesGlitch('hello'), false);

// Trade lock copy
assert.match(
  describeTradeLockReason({
    hasInstruction: false,
    blocked: false,
    glitchActive: false,
    instruction: null,
    tradeUnlocked: false,
  }) ?? '',
  /Manager/
);

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

const longTech = 'a'.repeat(400);
const clampedTech = clampPersonaReply('tech', longTech);
assert.equal(clampedTech.length, 320);
assert.ok(clampedTech.endsWith('…'));

const longCompliance = 'b'.repeat(400);
const clampedCompliance = clampPersonaReply('compliance', longCompliance);
assert.equal(clampedCompliance.length, 320);
assert.ok(clampedCompliance.endsWith('…'));

console.log('verify-game-logic: all checks passed');
