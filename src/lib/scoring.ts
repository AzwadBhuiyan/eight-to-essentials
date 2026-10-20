/**
 * Essential Eight maturity scoring.
 *
 * Rule (Essential Eight maturity model): a strategy is at maturity level L only when every
 * requirement at level L and every lower level is met. So the level is the highest L where
 * all requirements at levels 1 to L are met. If any Maturity Level One requirement is not met,
 * the strategy is at Maturity Level Zero.
 */
import {
  STRATEGIES,
  type E8Requirement,
  type MaturityLevel,
  type Strategy,
} from '../data/types.ts';
import { isMet, validAnswerFor } from './answers.ts';
import type { Answers, E8Result, StrategyResult } from './types.ts';

const LEVELS: MaturityLevel[] = [1, 2, 3];

/** The lowest level a requirement belongs to. It is asked once, at this level. */
export function lowestLevel(requirement: E8Requirement): MaturityLevel {
  return Math.min(...requirement.levels) as MaturityLevel;
}

export function scoreStrategy(
  strategy: Strategy,
  requirements: E8Requirement[],
  answers: Answers,
): StrategyResult {
  // Shared controls appear under several strategies; one answer counts for each of them.
  const own = requirements.filter((r) => r.strategies.includes(strategy));

  const unansweredIds: string[] = [];
  const unmetIdsByLevel: Record<MaturityLevel, string[]> = { 1: [], 2: [], 3: [] };
  for (const r of own) {
    const answer = validAnswerFor(r, answers);
    if (!answer) unansweredIds.push(r.id);
    else if (!isMet(answer)) unmetIdsByLevel[lowestLevel(r)].push(r.id);
  }

  // Any unanswered question means no level is shown for the strategy.
  if (unansweredIds.length > 0) {
    return { strategy, status: 'incomplete', level: null, unansweredIds, unmetIdsByLevel };
  }

  // Walk up the levels. A requirement counts at level L if it belongs to L or any lower level,
  // which is the same as its lowest level being L or below.
  let level: 0 | MaturityLevel = 0;
  for (const L of LEVELS) {
    const allMet = own
      .filter((r) => lowestLevel(r) <= L)
      .every((r) => isMet(validAnswerFor(r, answers)!));
    if (!allMet) break;
    level = L;
  }
  return { strategy, status: 'complete', level, unansweredIds, unmetIdsByLevel };
}

/**
 * Scores all eight strategies. The headline is the lowest strategy level, because ASD recommends
 * reaching each maturity level across all eight strategies before moving to the next.
 * It is not an official "overall maturity".
 */
export function scoreAll(requirements: E8Requirement[], answers: Answers): E8Result {
  const strategies = STRATEGIES.map((s) => scoreStrategy(s, requirements, answers));
  const headlineLevel = strategies.some((s) => s.level === null)
    ? null
    : (Math.min(...strategies.map((s) => s.level as number)) as 0 | MaturityLevel);
  return { strategies, headlineLevel };
}
