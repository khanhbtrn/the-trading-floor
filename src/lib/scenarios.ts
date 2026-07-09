import type { ScenarioConfig } from './types';

export const scenarios: ScenarioConfig[] = [
  {
    id: '2008',
    displayName: '2008 Financial Crisis',
    ticker: 'SPY',
    dateRange: 'Sept–Dec 2008',
    csvPath: '/data/scenario-2008.csv',
    locked: false,
  },
  {
    id: 'gme',
    displayName: 'GME Squeeze',
    ticker: 'GME',
    dateRange: 'Jan 2021',
    csvPath: '',
    locked: true,
  },
  {
    id: 'covid',
    displayName: 'COVID Crash',
    ticker: 'SPY',
    dateRange: 'Feb–Mar 2020',
    csvPath: '',
    locked: true,
  },
];

export function getScenarioById(id: string): ScenarioConfig | undefined {
  return scenarios.find((s) => s.id === id);
}
