import { createContext, useContext } from 'react';
import type { AssessmentAction, AssessmentState } from '../lib/assessment.ts';

/** 'off': saving not turned on. 'saved': saved on this device. 'failed': the browser blocked saving. */
export type SaveStatus = 'off' | 'saved' | 'failed';

/** Where links on the results, transition and wizard pages go. Different for the demo. */
export interface AssessmentPaths {
  context: string;
  results: string;
  transition: string;
  report: string;
  assessment: (step: number) => string;
}

export const OWN_PATHS: AssessmentPaths = {
  context: '/context',
  results: '/results',
  transition: '/transition',
  report: '/report',
  assessment: (step) => `/assessment/${step}`,
};

export const DEMO_PATHS: AssessmentPaths = {
  context: '/example/assessment/1',
  results: '/example',
  transition: '/example/transition',
  report: '/example/report',
  assessment: (step) => `/example/assessment/${step}`,
};

export interface AssessmentContextValue {
  state: AssessmentState;
  dispatch: (action: AssessmentAction) => void;
  replace: (state: AssessmentState) => void;
  savingEnabled: boolean;
  saveStatus: SaveStatus;
  setSaving: (enabled: boolean) => void;
  clearAll: () => void;
  /** True on the fictional demo's screens. The demo is read-only and never saved. */
  isDemo: boolean;
  paths: AssessmentPaths;
}

export const AssessmentContext = createContext<AssessmentContextValue | null>(null);

export function useAssessment(): AssessmentContextValue {
  const value = useContext(AssessmentContext);
  if (!value) throw new Error('useAssessment must be used inside <AssessmentProvider>');
  return value;
}
