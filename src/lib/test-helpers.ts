/**
 * Helpers for the logic tests. They build answer sets and results from the real data,
 * so tests read as "everything is Yes except…".
 */
import { e8Requirements } from '../data/index.ts';
import { STRATEGIES, type MaturityLevel, type Strategy } from '../data/types.ts';
import type { Answer, Answers, E8Result } from './types.ts';

/** Every requirement answered "Yes", with optional overrides by requirement ID. */
export function allYes(overrides: Record<string, Answer> = {}): Answers {
  const answers: Answers = {};
  for (const r of e8Requirements) answers[r.id] = { value: 'yes' };
  return { ...answers, ...overrides };
}

/** An E8 result with the given strategy levels. Unlisted strategies are at Maturity Level Three. */
export function resultWithLevels(
  levels: Partial<Record<Strategy, 0 | MaturityLevel | null>>,
): E8Result {
  const strategies = STRATEGIES.map((strategy) => {
    const level = strategy in levels ? (levels[strategy] ?? null) : 3;
    return {
      strategy,
      status: level === null ? ('incomplete' as const) : ('complete' as const),
      level,
      unansweredIds: [],
      unmetIdsByLevel: { 1: [], 2: [], 3: [] },
    };
  });
  return { strategies, headlineLevel: null };
}

export const no: Answer = { value: 'no' };
export const partly: Answer = { value: 'partly' };
export const notSure: Answer = { value: 'not-sure' };

export const validException: Extract<Answer, { value: 'exception' }> = {
  value: 'exception',
  reason: 'Legacy line-of-business application cannot run with this setting',
  compensatingControl: 'Application isolated on a separate network segment with extra monitoring',
  approvedBy: 'Chief Executive Officer',
  reviewDate: '2027-03-31',
};
