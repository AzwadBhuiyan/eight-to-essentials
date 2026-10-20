/**
 * Holds the current assessment (context answers and question answers) for the whole app.
 *
 * Saving is opt-in. Nothing is written to the browser's storage until the user turns saving on,
 * and turning it off (or clearing data) removes what was saved.
 */
import { useCallback, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { catalogue } from '../data/index.ts';
import {
  EMPTY_STATE,
  assessmentReducer,
  type AssessmentAction,
  type AssessmentState,
} from '../lib/assessment.ts';
import { clearSavedState, loadState, saveState } from '../lib/storage.ts';
import { AssessmentContext, type SaveStatus } from './assessmentContext.ts';

export function AssessmentProvider({ children }: { children: ReactNode }) {
  // Load saved data once, when the app starts. Saved data exists only if saving was turned on.
  const [initial] = useState(() => loadState(catalogue));
  const [state, dispatch] = useReducer(assessmentReducer, initial ?? EMPTY_STATE);
  const [savingEnabled, setSavingEnabled] = useState(initial !== null);
  const [saveFailed, setSaveFailed] = useState(false);

  // Save after every change while saving is on. This is the only place data is written.
  useEffect(() => {
    if (!savingEnabled) return;
    const failed = saveState(state, new Date()) === 'failed';
    // Updating state from an effect is fine here: it only records the outcome of the save.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaveFailed(failed);
  }, [state, savingEnabled]);

  const setSaving = useCallback((enabled: boolean) => {
    setSavingEnabled(enabled);
    if (!enabled) {
      clearSavedState();
      setSaveFailed(false);
    }
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: 'reset' });
    setSavingEnabled(false);
    setSaveFailed(false);
    clearSavedState();
  }, []);

  const saveStatus: SaveStatus = !savingEnabled ? 'off' : saveFailed ? 'failed' : 'saved';

  const value = useMemo(
    () => ({
      state,
      dispatch: dispatch as (action: AssessmentAction) => void,
      replace: (next: AssessmentState) => dispatch({ type: 'replace', state: next }),
      savingEnabled,
      saveStatus,
      setSaving,
      clearAll,
    }),
    [state, savingEnabled, saveStatus, setSaving, clearAll],
  );

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>;
}
