/**
 * Wording for the headline and each strategy's result, shared by the results page, the CSV export
 * and (later) the printed report, so they always say exactly the same thing.
 */
import { STRATEGIES } from '../data/types.ts';
import {
  LEVEL_NAMES,
  MET_ONLY_THROUGH_NA_LABEL,
  cannotExceedText,
  provisionalHeadline,
} from './text.ts';
import type { E8Result, StrategyResult } from './types.ts';

export function headlineText(e8: E8Result): string {
  if (e8.headlineLevel !== null) {
    return e8.headlineLevel === e8.target
      ? `Target reached: ${LEVEL_NAMES[e8.target]} across all eight strategies.`
      : `Headline: ${LEVEL_NAMES[e8.headlineLevel]} (your target: ${LEVEL_NAMES[e8.target]}).`;
  }
  if (e8.provisional) {
    return provisionalHeadline(
      e8.provisional.completeCount,
      STRATEGIES.length,
      e8.provisional.lowestCompleteLevel,
    );
  }
  return 'No strategy is complete yet, so there is no headline.';
}

export function strategyResultText(s: StrategyResult): string {
  if (s.level === null) {
    const left = s.requiredRemainingIds.length;
    const bound = s.cannotExceed === null ? '' : ` ${cannotExceedText(s.cannotExceed)}`;
    return `Incomplete: ${left} required question${left === 1 ? '' : 's'} left.${bound}`;
  }
  const parts: string[] = [LEVEL_NAMES[s.level]];
  if (s.level === s.target) parts.push('(your target)');
  if (s.metOnlyThroughNotApplicable) parts.push(`(${MET_ONLY_THROUGH_NA_LABEL})`);
  return parts.join(' ');
}

/**
 * The level the headline actually reports, and whether it is final.
 * Final: the lowest strategy level, once every strategy is complete. Not final: the lowest level
 * among the complete strategies (or none). This is never simply the target.
 */
export function headlineStatus(e8: E8Result): {
  level: 0 | 1 | 2 | 3 | null;
  final: boolean;
} {
  if (e8.headlineLevel !== null) return { level: e8.headlineLevel, final: true };
  return { level: e8.provisional?.lowestCompleteLevel ?? null, final: false };
}
