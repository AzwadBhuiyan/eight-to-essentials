import { createContext, useContext } from 'react';
import type { AssessmentAction, AssessmentState } from '../lib/assessment.ts';

/** 'off': saving not turned on. 'saved': saved on this device. 'failed': the browser blocked saving. */
export type SaveStatus = 'off' | 'saved' | 'failed';

export interface AssessmentContextValue {
  state: AssessmentState;
  dispatch: (action: AssessmentAction) => void;
  replace: (state: AssessmentState) => void;
  savingEnabled: boolean;
  saveStatus: SaveStatus;
  setSaving: (enabled: boolean) => void;
  clearAll: () => void;
}

export const AssessmentContext = createContext<AssessmentContextValue | null>(null);

export function useAssessment(): AssessmentContextValue {
  const value = useContext(AssessmentContext);
  if (!value) throw new Error('useAssessment must be used inside <AssessmentProvider>');
  return value;
}
