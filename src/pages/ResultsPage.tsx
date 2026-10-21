import { lazy, Suspense, useMemo } from 'react';
import { ActionListSection } from '../components/ActionListSection.tsx';
import { Disclaimer } from '../components/Disclaimer.tsx';
import { FrameworkTag } from '../components/FrameworkTag.tsx';
import { JourneySteps } from '../components/JourneySteps.tsx';
import { PartsSummary } from '../components/PartsSummary.tsx';
import { EvidenceSection } from '../components/EvidenceSection.tsx';
import { ExceptionsSection } from '../components/ExceptionsSection.tsx';
import { downloadText, localDateStamp } from '../components/download.ts';
import { usePageFocus } from '../components/usePageFocus.ts';
import { frameworkData, productGroups } from '../data/index.ts';
import { evidenceRequests, exceptionsToReview } from '../lib/evidence.ts';
import { buildActionList } from '../lib/prioritise.ts';
import { resultsToCsv } from '../lib/resultsCsv.ts';
import { headlineText, strategyResultText } from '../lib/resultsText.ts';
import { HEADLINE_EXPLANATION, LEVEL_NAMES } from '../lib/text.ts';
import { href } from '../router.ts';
import { useAssessment } from '../state/assessmentContext.ts';
import { useDerived } from '../state/useDerived.ts';

// The chart library is only downloaded when the results page is shown.
const StrategyRadarChart = lazy(() => import('../components/StrategyRadarChart.tsx'));

export function ResultsPage() {
  const { state } = useAssessment();
  const { e8, target, effective, asked } = useDerived(state);
  const headingRef = usePageFocus<HTMLHeadingElement>('Results');
  const today = localDateStamp(new Date());

  const { actionList, evidence, exceptions } = useMemo(
    () => ({
      actionList: buildActionList(
        frameworkData,
        effective.answers,
        state.context,
        e8,
        state.skipped,
      ),
      evidence: evidenceRequests(asked, effective.answers),
      exceptions: exceptionsToReview(asked, effective.answers, today, effective.fromGroup),
    }),
    [effective, state.context, state.skipped, e8, asked, today],
  );

  const anyAnswered = Object.keys(effective.answers).length > 0;

  function exportCsv() {
    downloadText(
      `eight-to-essentials-results-${today}.csv`,
      resultsToCsv({
        context: state.context,
        e8,
        actionList,
        evidence,
        exceptions,
        productGroups,
      }),
      'text/csv;charset=utf-8',
    );
  }

  return (
    <>
      <JourneySteps current={2} />
      <FrameworkTag framework="e8" />
      <h1 ref={headingRef} tabIndex={-1}>
        Essential Eight results
      </h1>
      <PartsSummary current={1} />
      {state.context.organisationName.trim() && (
        <p className="muted">For {state.context.organisationName.trim()}</p>
      )}
      <Disclaimer />
      <p className="lead">{headlineText(e8)}</p>
      <p>
        {HEADLINE_EXPLANATION} Results are measured against your target, {LEVEL_NAMES[target]}, and
        never go above it.
      </p>

      {!anyAnswered ? (
        <p>
          You have not answered any questions yet.{' '}
          <a href={href('/context')}>Start the assessment</a>.
        </p>
      ) : (
        <>
          <section aria-labelledby="levels-heading">
            <FrameworkTag framework="e8" />
            <h2 id="levels-heading">Essential Eight maturity by strategy</h2>
            <Suspense fallback={<p className="muted">Loading chart…</p>}>
              <StrategyRadarChart e8={e8} />
            </Suspense>
            <table>
              <caption>
                Essential Eight maturity by strategy (target: {LEVEL_NAMES[target]})
              </caption>
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
                    <td>{strategyResultText(s)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <ActionListSection list={actionList} />
          <EvidenceSection requests={evidence} />
          <ExceptionsSection items={exceptions} productGroups={productGroups} />

          <div className="button-row">
            <button type="button" className="button button--secondary" onClick={exportCsv}>
              Export results (CSV)
            </button>
          </div>

          <section className="panel" aria-labelledby="next-step">
            <FrameworkTag framework="essentials" />
            <h2 id="next-step" className="panel__title">
              Next step (optional)
            </h2>
            <p>
              ASD published ASD Essentials on 15 October 2026. See which ASD Essentials actions your
              Essential Eight work may carry into, what may need strengthening, and what is not
              covered by the Essential Eight at all. Indicative only.
            </p>
            <a className="button" href={href('/transition')}>
              See how this carries into ASD Essentials
            </a>
          </section>
        </>
      )}

      <p>
        <a className="button button--secondary" href={href('/assessment/1')}>
          Back to the assessment
        </a>
      </p>
    </>
  );
}
