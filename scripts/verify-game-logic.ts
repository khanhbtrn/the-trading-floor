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
import {
  formatInstructionLabel,
  instructionCashPct,
  resolveInstructionShares,
  salvageInstructionFromReply,
} from '../src/lib/tradeSizing';
import { MAX_POSITION_PCT_OF_CASH } from '../src/lib/gameReducer';

// Risk gate — 500 shares @ $100 on $100k cash = 50%
assert.equal(
  instructionFailsRisk({ action: 'buy', sizeShares: 500, reason: 'ok' }, 100, 100_000),
  false
);
assert.equal(
  instructionFailsRisk({ action: 'buy', sizeShares: 600, reason: 'big' }, 100, 100_000),
  true
);
assert.equal(MAX_POSITION_PCT_OF_CASH, 50);

// Compliant resize bonus only after a rejection
assert.equal(
  compliantResizeBonus([], { action: 'buy', sizeShares: 300, reason: 'ok' }, 100, 100_000),
  0
);
assert.equal(
  compliantResizeBonus(
    [{ source: 'blocked', note: 'rejected' }],
    { action: 'buy', sizeShares: 300, reason: 'ok' },
    100,
    100_000
  ),
  CONDUCT_COMPLIANT_RESIZE_BONUS
);
assert.equal(
  compliantResizeBonus(
    [{ source: 'blocked' }],
    { action: 'buy', sizeShares: 600, reason: 'still big' },
    100,
    100_000
  ),
  0
);

// Rank thresholds
assert.equal(computeRank(0, 100), 'Junior Trader');
assert.equal(computeRank(0, 80), 'Junior Trader');
assert.equal(computeRank(49_999, 100), 'Junior Trader');
assert.equal(computeRank(50_000, 70), 'Associate');
assert.equal(computeRank(50_000, 69), 'Junior Trader');
assert.equal(computeRank(200_000, 80), 'VP');
assert.equal(computeRank(200_000, 79), 'Associate');
assert.equal(computeRank(500_000, 90), 'Desk Head');
assert.equal(computeRank(500_000, 89), 'VP');
assert.equal(computeRank(-1, 50), 'Junior Trader');

// Conduct constants documented for playthrough QA
assert.equal(CONDUCT_OVERRIDE_PENALTY, 20);
assert.equal(CONDUCT_GLITCH_PANIC_PENALTY, 10);
assert.equal(CONDUCT_ORDER_EXPIRED, -5);

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

const managerShares = normalizeNpcResponse({
  reply: 'buy 500 shares now',
  instruction: { action: 'buy', sizeShares: 500, reason: 'conviction' },
  blocked: false,
  resolvesGlitch: false,
});
assert.ok(managerShares?.instruction);
assert.equal(managerShares!.instruction!.sizeShares, 500);

const legacyPct = resolveInstructionShares(
  { action: 'buy', sizeShares: 0, sizePctOfCash: 50, reason: 'legacy' },
  100,
  100_000
);
assert.ok(legacyPct);
assert.equal(legacyPct!.sizeShares, 500);

const salvagedInstruction = salvageInstructionFromReply(
  'MOVE ON THIS. BUY 450 shares now.',
  100,
  100_000
);
assert.ok(salvagedInstruction);
assert.equal(salvagedInstruction!.action, 'buy');
assert.equal(salvagedInstruction!.sizeShares, 450);

assert.equal(instructionCashPct(500, 100, 100_000), 50);
assert.equal(formatInstructionLabel('buy', 500), 'BUY 500 shares');

console.log('verify-game-logic: all checks passed');
