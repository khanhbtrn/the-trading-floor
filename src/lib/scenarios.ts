import type { ScenarioConfig } from './types';

/** Swappable scenario configs — 2008 content filled in Hour 1:30 data slice. */
export const scenarios: ScenarioConfig[] = [
  {
    id: '2008',
    displayName: '2008 Financial Crisis',
    ticker: 'SPY',
    dateRange: 'Sept–Dec 2008',
    csvPath: '/data/scenario-2008.csv',
  },
];

export function getScenarioById(id: string): ScenarioConfig | undefined {
  return scenarios.find((s) => s.id === id);
}
