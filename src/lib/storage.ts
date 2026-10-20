/**
 * Opt-in saving of progress in the browser's local storage.
 *
 * Nothing is stored unless the user turns saving on. Every storage call is wrapped in try/catch,
 * because storage can be unavailable (private browsing, blocked by settings, or full).
 * Saved data is validated like an imported file before it is used.
 */
import type { E8Requirement } from '../data/types.ts';
import type { AssessmentState } from './assessment.ts';
import { buildExport, parseImport } from './importExport.ts';

export const STORAGE_KEY = 'eight-to-essentials:assessment';

export type SaveOutcome = 'saved' | 'failed';

/** The subset of the Storage API this module needs, so tests can pass a fake. */
export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function browserStore(): KeyValueStore | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function saveState(
  state: AssessmentState,
  now: Date,
  store: KeyValueStore | null = browserStore(),
): SaveOutcome {
  try {
    if (!store) return 'failed';
    store.setItem(STORAGE_KEY, JSON.stringify(buildExport(state, now)));
    return 'saved';
  } catch {
    return 'failed';
  }
}

/** Returns the saved state, or null if nothing is saved, storage is unavailable or the data is invalid. */
export function loadState(
  requirements: E8Requirement[],
  store: KeyValueStore | null = browserStore(),
): AssessmentState | null {
  try {
    const text = store?.getItem(STORAGE_KEY);
    if (!text) return null;
    const result = parseImport(text, text.length, requirements);
    return result.ok ? result.state : null;
  } catch {
    return null;
  }
}

/** Removes saved data. Returns false if storage could not be reached. */
export function clearSavedState(store: KeyValueStore | null = browserStore()): boolean {
  try {
    if (!store) return false;
    store.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
