import type { Screen } from './types';

export const SCREEN_PATHS: Record<Screen, string> = {
  SCENARIO_SELECT: '/select',
  BRIEFING: '/briefing',
  RISK_CHECK: '/risk-check',
  ESCALATION: '/escalation',
  DESK: '/desk',
  SCORECARD: '/scorecard',
};

const NAVIGATING_ACTIONS = new Set([
  'SELECT_SCENARIO',
  'BRIEFING_COMPLETE',
  'RISK_CHECK_CONTINUE',
  'COMPLIANCE_OVERRIDE',
  'COMPLIANCE_REJECT',
  'END_SESSION',
  'RESET_GAME',
]);

export function pathForScreen(screen: Screen): string {
  return SCREEN_PATHS[screen];
}

export function shouldNavigateAfterAction(actionType: string): boolean {
  return NAVIGATING_ACTIONS.has(actionType);
}
