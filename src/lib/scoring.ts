/**
 * Essential Eight maturity scoring, with a target level and adaptive skipping.
 *
 * Base rule (Essential Eight maturity model): a strategy is at maturity level L only when every
 * requirement at level L and every lower level is met.
 *
 * Target level (methodology D29): only requirements whose lowest level is at or below the target
 * are asked, and a strategy's level is never reported above the target.
 *
 * Adaptive skipping (methodology D30): let F be the lowest level of any answered requirement that
 * is not met. The strategy cannot reach level F, so:
 * - required: every in-scope requirement below F (everything in scope if nothing has failed)
 * - not needed: everything else, which becomes optional
 * The strategy is complete once every required requirement has a valid answer. Its level is then
 * F - 1 if something failed, otherwise the target. All required answers are met by construction,
 * so a level is never claimed without a met answer for every requirement at and below it.
 */
import {
  STRATEGIES,
  type E8Requirement,
  type MaturityLevel,
  type Strategy,
} from '../data/types.ts';
import { isMet, validAnswerFor } from './answers.ts';
import type { Answers, E8Result, StrategyResult } from './types.ts';

/** The lowest level a requirement belongs to. It is asked once, at this level. */
export function lowestLevel(requirement: E8Requirement): MaturityLevel {
  return Math.min(...requirement.levels) as MaturityLevel;
}

export function scoreStrategy(
  strategy: Strategy,
  requirements: E8Requirement[],
  answers: Answers,
  target: MaturityLevel,
): StrategyResult {
  // Shared controls appear under several strategies; one answer counts for each of them.
  const own = requirements.filter(
    (r) => r.strategies.includes(strategy) && lowestLevel(r) <= target,
  );

  const unmetIdsByLevel: Record<MaturityLevel, string[]> = { 1: [], 2: [], 3: [] };
  let failedLevel: MaturityLevel | null = null;
  for (const r of own) {
    const answer = validAnswerFor(r, answers);
    if (answer && !isMet(answer)) {
      const level = lowestLevel(r);
      unmetIdsByLevel[level].push(r.id);
      if (failedLevel === null || level < failedLevel) failedLevel = level;
    }
  }

  const isRequired = (r: E8Requirement) => failedLevel === null || lowestLevel(r) < failedLevel;
  const unanswered = (r: E8Requirement) => !validAnswerFor(r, answers);
  const required = own.filter(isRequired);
  const requiredRemainingIds = required.filter(unanswered).map((r) => r.id);
  const notNeededIds = own.filter((r) => !isRequired(r) && unanswered(r)).map((r) => r.id);
  const cannotExceed = failedLevel === null ? null : ((failedLevel - 1) as 0 | MaturityLevel);

  const base = {
    strategy,
    target,
    requiredIds: required.map((r) => r.id),
    requiredRemainingIds,
    notNeededIds,
    unmetIdsByLevel,
    cannotExceed,
  };

  if (requiredRemainingIds.length > 0) {
    return { ...base, status: 'incomplete', level: null, metOnlyThroughNotApplicable: false };
  }

  const level = cannotExceed ?? target;
  // A level reached only because every requirement it needed was "Does not apply" is labelled,
  // so it is not mistaken for implemented controls.
  const neededForLevel = own.filter((r) => lowestLevel(r) <= level);
  const metOnlyThroughNotApplicable =
    level > 0 &&
    neededForLevel.length > 0 &&
    neededForLevel.every((r) => validAnswerFor(r, answers)?.value === 'not-applicable');

  return { ...base, status: 'complete', level, metOnlyThroughNotApplicable };
}

/**
 * Scores all eight strategies against the target. The headline is the lowest strategy level,
 * because ASD recommends reaching each maturity level across all eight strategies before moving
 * to the next. It is only final when every strategy is complete; otherwise a provisional value
 * is given, to be clearly labelled as based on incomplete answers.
 */
export function scoreAll(
  requirements: E8Requirement[],
  answers: Answers,
  target: MaturityLevel,
): E8Result {
  const strategies = STRATEGIES.map((s) => scoreStrategy(s, requirements, answers, target));
  const completeLevels = strategies.flatMap((s) => (s.level === null ? [] : [s.level]));
  const lowest = (levels: number[]) => Math.min(...levels) as 0 | MaturityLevel;

  const allComplete = completeLevels.length === strategies.length;
  return {
    strategies,
    target,
    headlineLevel: allComplete ? lowest(completeLevels) : null,
    provisional:
      !allComplete && completeLevels.length > 0
        ? { lowestCompleteLevel: lowest(completeLevels), completeCount: completeLevels.length }
        : null,
  };
}
