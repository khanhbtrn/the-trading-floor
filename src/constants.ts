export const PNL_TO_CONDUCT_WEIGHT = 50;

export const RANK_THRESHOLDS = {
  ASSOCIATE: 0,
  VP: 5000,
  DESK_HEAD: 15000,
} as const;

export const CONDUCT_DELTAS = {
  OVERRIDE: -10,
  BLOCKED: 0,
  GLITCH_RESOLVED: 0,
} as const;

export const TICK_INTERVAL_MS = 2000;

export const POSITION_SIZE_LIMIT = 5000;

export const INSTRUCTION_SIZE_TOLERANCE = 0.1;

export const RESTRICTED_TICKERS = ['LEH', 'BSC'];

export const INITIAL_CONDUCT_SCORE = 100;
