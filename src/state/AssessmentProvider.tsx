/**
 * Holds the current assessment (context answers and question answers) for the whole app.
 *
 * Saving is opt-in. Nothing is written to the browser's storage until the user turns saving on,
 * and turning it off (or clearing data) removes what was saved.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { catalogue } from '../data/index.ts';
import {
  EMPTY_STATE,
  assessmentReducer,
  type AssessmentAction,
  type AssessmentState,
} from '../lib/assessment.ts';
import { clearSavedState, loadState, saveState } from '../lib/storage.ts';
import { AssessmentContext, OWN_PATHS, type SaveStatus } from './assessmentContext.ts';

export function AssessmentProvider({ children }: { children: ReactNode }) {
  // Load saved data once, when the app starts. Saved data exists only if saving was turned on.
  const [initial] = useState(() => loadState(catalogue));
  const [state, dispatch] = useReducer(assessmentReducer, initial ?? EMPTY_STATE);
  const [savingEnabled, setSavingEnabled] = useState(initial !== null);
  const [saveFailed, setSaveFailed] = useState(false);
  // The state already in storage. Starts as the loaded state, so opening the app does not
  // rewrite saved data that has not changed.
  const lastSaved = useRef<AssessmentState | null>(initial);

  // Save after every change while saving is on. This is the only place data is written.
  useEffect(() => {
    if (!savingEnabled || state === lastSaved.current) return;
    lastSaved.current = state;
    const failed = saveState(state, new Date()) === 'failed';
    // Record whether the save worked, so the page can say so.
    setSaveFailed(failed);
  }, [state, savingEnabled]);

  const setSaving = useCallback((enabled: boolean) => {
    setSavingEnabled(enabled);
    if (!enabled) {
      clearSavedState();
      lastSaved.current = null; // turning saving back on writes the current answers again
      setSaveFailed(false);
    }
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: 'reset' });
    setSavingEnabled(false);
    setSaveFailed(false);
    clearSavedState();
    lastSaved.current = null;
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
      isDemo: false,
      paths: OWN_PATHS,
    }),
    [state, savingEnabled, saveStatus, setSaving, clearAll],
  );

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>;
}
