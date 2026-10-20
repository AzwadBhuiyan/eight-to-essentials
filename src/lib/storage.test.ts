import { describe, expect, it } from 'vitest';
import { e8Requirements } from '../data/index.ts';
import { EMPTY_STATE, type AssessmentState } from './assessment.ts';
import {
  STORAGE_KEY,
  clearSavedState,
  loadState,
  saveState,
  type KeyValueStore,
} from './storage.ts';

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

const throwingStore: KeyValueStore = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
  removeItem: () => {
    throw new Error('SecurityError');
  },
};

const state: AssessmentState = { ...EMPTY_STATE, answers: { 'ISM-0843': { value: 'yes' } } };
const now = new Date('2026-10-20T00:00:00.000Z');

describe('opt-in storage', () => {
  it('saves and loads an assessment', () => {
    const store = memoryStore();
    expect(saveState(state, now, store)).toBe('saved');
    expect(loadState(e8Requirements, store)).toEqual(state);
  });

  it('clears saved data', () => {
    const store = memoryStore();
    saveState(state, now, store);
    expect(clearSavedState(store)).toBe(true);
    expect(store.data.has(STORAGE_KEY)).toBe(false);
    expect(loadState(e8Requirements, store)).toBeNull();
  });

  it('copes when storage throws errors', () => {
    expect(saveState(state, now, throwingStore)).toBe('failed');
    expect(loadState(e8Requirements, throwingStore)).toBeNull();
    expect(clearSavedState(throwingStore)).toBe(false);
  });

  it('copes when storage is unavailable', () => {
    expect(saveState(state, now, null)).toBe('failed');
    expect(loadState(e8Requirements, null)).toBeNull();
  });

  it('ignores saved data that fails validation', () => {
    const store = memoryStore();
    store.setItem(STORAGE_KEY, JSON.stringify({ format: 'eight-to-essentials-answers', bad: 1 }));
    expect(loadState(e8Requirements, store)).toBeNull();
  });
});
