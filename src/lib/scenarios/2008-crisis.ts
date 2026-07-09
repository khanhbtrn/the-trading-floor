import type { ScenarioConfig } from '../types';
import { defaultRiskRules } from '../rules/defaultRules';

const priceSeries = [
  { tick: 0, date: 'Sep 15, 2008', price: 4.25 },
  { tick: 1, date: 'Sep 16, 2008', price: 3.82 },
  { tick: 2, date: 'Sep 17, 2008', price: 3.45 },
  { tick: 3, date: 'Sep 18, 2008', price: 2.98 },
  { tick: 4, date: 'Sep 19, 2008', price: 2.55 },
  { tick: 5, date: 'Sep 22, 2008', price: 2.12 },
  { tick: 6, date: 'Sep 23, 2008', price: 1.88 },
  { tick: 7, date: 'Sep 24, 2008', price: 1.65 },
  { tick: 8, date: 'Sep 25, 2008', price: 1.42 },
  { tick: 9, date: 'Sep 26, 2008', price: 1.28 },
  { tick: 10, date: 'Sep 29, 2008', price: 0.95 },
  { tick: 11, date: 'Sep 30, 2008', price: 0.72 },
  { tick: 12, date: 'Oct 1, 2008', price: 0.58 },
];

export const crisis2008: ScenarioConfig = {
  id: '2008-crisis',
  name: '2008 Financial Crisis',
  dateRange: 'Sept–Dec 2008',
  flavorText: 'Lehman has fallen. The desk needs conviction — and cover.',
  ticker: 'LEH',
  startingCash: 100000,
  priceSeries,
  riskRules: defaultRiskRules,
  glitch: {
    triggerTick: 5,
    description: 'Trading platform connectivity lost — orders queue frozen.',
  },
  briefingScript: [
    {
      id: 'brief-start',
      speaker: 'Marcus (Desk Head)',
      text: 'Morning. Lehman paper is moving fast. Compliance is watching every ticket today.',
      choices: [
        { id: 'brief-1a', label: 'Understood. What\'s the play?', nextNodeId: 'brief-play' },
        { id: 'brief-1b', label: 'How bad is the restricted-list exposure?', nextNodeId: 'brief-restricted' },
      ],
    },
    {
      id: 'brief-restricted',
      speaker: 'Marcus (Desk Head)',
      text: 'LEH is restricted for new longs over 5,000 shares. But the desk needs size if we believe the bounce.',
      choices: [
        { id: 'brief-2a', label: 'Got it. What size are you thinking?', nextNodeId: 'brief-play' },
      ],
    },
    {
      id: 'brief-play',
      speaker: 'Marcus (Desk Head)',
      text: 'I want you to buy 8,000 shares of LEH at market. We think the panic is overdone — this is a liquidity grab, not a solvency call.',
      choices: [
        { id: 'brief-3a', label: '8,000 shares — I\'ll get it done.', nextNodeId: 'brief-confirm' },
        { id: 'brief-3b', label: 'That\'s above the position limit. Are you sure?', nextNodeId: 'brief-pushback' },
      ],
    },
    {
      id: 'brief-pushback',
      speaker: 'Marcus (Desk Head)',
      text: 'I know the limits. Get the size — if Risk blocks you, take it to Compliance. Time matters.',
      choices: [
        { id: 'brief-4a', label: 'Copy. Executing 8,000 LEH buy.', nextNodeId: 'brief-confirm' },
      ],
    },
    {
      id: 'brief-confirm',
      speaker: 'Marcus (Desk Head)',
      text: 'Good. Ticket it clean. I\'ll be watching the tape.',
      instruction: {
        id: 'instr-001',
        text: 'Buy 8,000 shares of LEH at market',
        action: 'BUY',
        targetSize: 8000,
        ticker: 'LEH',
        riskFlags: ['position-size-limit', 'restricted-list'],
      },
    },
  ],
  complianceScript: [
    {
      id: 'comp-start',
      speaker: 'Sarah (Compliance)',
      text: 'Your instruction tripped two rules: position size limit and restricted-list. I need a documented justification before I can grant an override.',
      choices: [
        { id: 'comp-1a', label: 'Liquidity justification: client redemption requires immediate LEH exposure.', nextNodeId: 'comp-liquidity' },
        { id: 'comp-1b', label: 'Reduce size to 4,000 shares instead.', nextNodeId: 'comp-reject-clean' },
        { id: 'comp-1c', label: 'Desk head verbal authorization — override now.', nextNodeId: 'comp-denied' },
      ],
    },
    {
      id: 'comp-liquidity',
      speaker: 'Sarah (Compliance)',
      text: 'Liquidity event is documented. I\'m granting a one-time override. This goes on your audit trail and costs conduct points.',
      choices: [
        {
          id: 'comp-override',
          label: 'Acknowledged. Proceeding to desk.',
          outcome: 'override',
          justification: 'Compliance override granted: liquidity justification',
        },
      ],
    },
    {
      id: 'comp-reject-clean',
      speaker: 'Sarah (Compliance)',
      text: 'Smart call. Resize the ticket within limits — no override needed.',
      choices: [
        {
          id: 'comp-reject',
          label: 'Will trade within limits.',
          outcome: 'reject',
          justification: 'Instruction rejected: resized to comply with limits',
        },
      ],
    },
    {
      id: 'comp-denied',
      speaker: 'Sarah (Compliance)',
      text: 'Verbal authorization is not sufficient documentation. Override denied. Trade within limits or stand down.',
      choices: [
        {
          id: 'comp-denied-reject',
          label: 'Understood. Standing down on the flagged instruction.',
          outcome: 'reject',
          justification: 'Override denied: insufficient documentation',
        },
      ],
    },
  ],
  techScript: [
    {
      id: 'tech-start',
      speaker: 'Dev (Tech Support)',
      text: 'We\'re seeing a gateway timeout on the order management system. Trading is frozen until we clear the queue.',
      choices: [
        { id: 'tech-1a', label: 'Run diagnostics on the OMS gateway.', nextNodeId: 'tech-diag' },
        { id: 'tech-1b', label: 'Force-kill pending orders and reconnect.', nextNodeId: 'tech-force' },
      ],
    },
    {
      id: 'tech-diag',
      speaker: 'Dev (Tech Support)',
      text: 'Diagnostics show a stale TCP connection. Reconnecting now...',
      choices: [
        { id: 'tech-1c', label: 'Confirm reconnect and resume trading.', nextNodeId: 'tech-resolve' },
      ],
    },
    {
      id: 'tech-force',
      speaker: 'Dev (Tech Support)',
      text: 'Pending orders purged. Gateway reconnected. You\'re back online.',
      choices: [
        { id: 'tech-1d', label: 'Resume trading.', nextNodeId: 'tech-resolve' },
      ],
    },
    {
      id: 'tech-resolve',
      speaker: 'Dev (Tech Support)',
      text: 'System restored. Any orders entered during the outage were discarded.',
      choices: [
        {
          id: 'tech-done',
          label: 'Copy. Back to the desk.',
          outcome: 'resolve',
        },
      ],
    },
  ],
};
