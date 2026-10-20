import { Disclaimer } from '../components/Disclaimer.tsx';
import { usePageFocus } from '../components/usePageFocus.ts';
import { STRATEGIES } from '../data/types.ts';
import {
  HEADLINE_EXPLANATION,
  LEVEL_NAMES,
  MET_ONLY_THROUGH_NA_LABEL,
  cannotExceedText,
  provisionalHeadline,
} from '../lib/text.ts';
import type { StrategyResult } from '../lib/types.ts';
import { href } from '../router.ts';
import { useAssessment } from '../state/assessmentContext.ts';
import { useDerived } from '../state/useDerived.ts';

function strategyText(s: StrategyResult): string {
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
 * A short summary of strategy levels against the target, available at any time.
 * The full results page (charts, actions, evidence) follows.
 */
export function ResultsPage() {
  const { state } = useAssessment();
  const { e8, target } = useDerived(state);
  const headingRef = usePageFocus<HTMLHeadingElement>('Results');

  let headline: string;
  if (e8.headlineLevel !== null) {
    headline =
      e8.headlineLevel === target
        ? `Target reached: ${LEVEL_NAMES[target]} across all eight strategies.`
        : `Headline: ${LEVEL_NAMES[e8.headlineLevel]} (your target: ${LEVEL_NAMES[target]}).`;
  } else if (e8.provisional) {
    headline = provisionalHeadline(
      e8.provisional.completeCount,
      STRATEGIES.length,
      e8.provisional.lowestCompleteLevel,
    );
  } else {
    headline = 'No strategy is complete yet, so there is no headline.';
  }

  return (
    <>
      <h1 ref={headingRef} tabIndex={-1}>
        Essential Eight results
      </h1>
      <Disclaimer />
      <p className="lead">{headline}</p>
      <p>
        {HEADLINE_EXPLANATION} Results are measured against your target, {LEVEL_NAMES[target]}, and
        never go above it.
      </p>
      <table>
        <caption>Essential Eight maturity by strategy</caption>
        <thead>
          <tr>
            <th scope="col">Strategy</th>
            <th scope="col">Result</th>
          </tr>
        </thead>
        <tbody>
          {e8.strategies.map((s) => (
            <tr key={s.strategy}>
              <th scope="row">{s.strategy}</th>
              <td>{strategyText(s)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        <a className="button button--secondary" href={href('/assessment/1')}>
          Back to the assessment
        </a>
      </p>
    </>
  );
}
