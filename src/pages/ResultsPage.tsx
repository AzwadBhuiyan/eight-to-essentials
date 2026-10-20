import { Disclaimer } from '../components/Disclaimer.tsx';
import { usePageFocus } from '../components/usePageFocus.ts';
import { e8Requirements } from '../data/index.ts';
import { scoreAll } from '../lib/scoring.ts';
import { HEADLINE_EXPLANATION, LEVEL_NAMES } from '../lib/text.ts';
import { href } from '../router.ts';
import { useAssessment } from '../state/assessmentContext.ts';

/** A short summary of strategy levels. The full results page (charts, actions, evidence) follows. */
export function ResultsPage() {
  const { state } = useAssessment();
  const headingRef = usePageFocus<HTMLHeadingElement>('Results');
  const result = scoreAll(e8Requirements, state.answers);

  return (
    <>
      <h1 ref={headingRef} tabIndex={-1}>
        Results
      </h1>
      <Disclaimer />
      <p className="lead">
        {result.headlineLevel === null
          ? 'Headline: not available until every strategy is complete.'
          : `Headline: ${LEVEL_NAMES[result.headlineLevel]}`}
      </p>
      <p>{HEADLINE_EXPLANATION}</p>
      <table>
        <caption>Essential Eight maturity by strategy</caption>
        <thead>
          <tr>
            <th scope="col">Strategy</th>
            <th scope="col">Result</th>
          </tr>
        </thead>
        <tbody>
          {result.strategies.map((s) => (
            <tr key={s.strategy}>
              <th scope="row">{s.strategy}</th>
              <td>
                {s.level === null
                  ? `Incomplete (${s.unansweredIds.length} unanswered)`
                  : LEVEL_NAMES[s.level]}
              </td>
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
