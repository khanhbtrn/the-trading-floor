import { crisis2008 } from './2008-crisis';
import type { ScenarioConfig } from '../types';

export const scenarios: ScenarioConfig[] = [crisis2008];

export function getScenarioById(id: string): ScenarioConfig | undefined {
  return scenarios.find((s) => s.id === id);
}
