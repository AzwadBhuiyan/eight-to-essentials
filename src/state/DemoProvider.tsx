/**
 * Supplies the fictional demo's answers to the pages inside it, in place of the user's own.
 *
 * The demo is isolated from the user's data by design:
 * - it has its own state (DEMO_STATE), which is never written to storage
 * - every change is ignored, so it is read-only
 * - save, clear, import and replace do nothing here, so the user's own data cannot be touched
 *   from a demo screen
 * The user's own AssessmentProvider keeps running outside, unchanged.
 */
import { useMemo, type ReactNode } from 'react';
import { DEMO_STATE } from '../lib/demo.ts';
import { AssessmentContext, DEMO_PATHS, type AssessmentContextValue } from './assessmentContext.ts';

const ignore = () => {};

export function DemoProvider({ children }: { children: ReactNode }) {
  const value = useMemo<AssessmentContextValue>(
    () => ({
      state: DEMO_STATE,
      dispatch: ignore,
      replace: ignore,
      savingEnabled: false,
      saveStatus: 'off',
      setSaving: ignore,
      clearAll: ignore,
      isDemo: true,
      paths: DEMO_PATHS,
    }),
    [],
  );
  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>;
}
