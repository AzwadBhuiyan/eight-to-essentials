import { lazy, Suspense, useMemo, useState } from 'react';
import { ActionListSection } from '../components/ActionListSection.tsx';
import { EvidenceSection } from '../components/EvidenceSection.tsx';
import { ExceptionsSection } from '../components/ExceptionsSection.tsx';
import { FrameworkTag } from '../components/FrameworkTag.tsx';
import { TransitionSummary } from '../components/TransitionSummary.tsx';
import { localDateStamp } from '../components/download.ts';
import { usePageFocus } from '../components/usePageFocus.ts';
import { author } from '../config/author.ts';
import { frameworkData, meta, productGroups } from '../data/index.ts';
import { DEMO_LABEL } from '../lib/demo.ts';
import { evidenceRequests, exceptionsToReview } from '../lib/evidence.ts';
import { buildActionList } from '../lib/prioritise.ts';
import { headlineText, strategyResultText } from '../lib/resultsText.ts';
import { printFooterText, reportDate } from '../lib/siteText.ts';
import { DISCLAIMER, HEADLINE_EXPLANATION, LEVEL_NAMES } from '../lib/text.ts';
import { buildTransition } from '../lib/transition.ts';
import { href } from '../router.ts';
import { useAssessment } from '../state/assessmentContext.ts';
import { useDerived } from '../state/useDerived.ts';

const StrategyRadarChart = lazy(() => import('../components/StrategyRadarChart.tsx'));

/**
 * The printable report (Print, or Save as PDF, from the browser). It uses the same components and
 * wording functions as the results and transition pages and the CSV, so they can never disagree.
 */
export function ReportPage() {
  const { state, isDemo, paths } = useAssessment();
  const { e8, target, effective, asked } = useDerived(state);
  const [includePart2, setIncludePart2] = useState(true);
  const headingRef = usePageFocus<HTMLHeadingElement>(isDemo ? 'Demo: report' : 'Report');
  // The report's date is fixed when the page opens, so it stays the same while it is open.
  const [now] = useState(() => new Date());
  const today = localDateStamp(now);

  const { actionList, evidence, exceptions, transition } = useMemo(
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
      transition: buildTransition(frameworkData, e8, effective.answers),
    }),
    [effective, state.context, state.skipped, e8, asked, today],
  );

  const organisation = state.context.organisationName.trim();
  const footer = printFooterText(author.name, isDemo);

  return (
    <div className="report">
      {/* Screen-only controls; hidden when printing. */}
      <div className="report__controls no-print">
        <p>
          Use your browser&apos;s Print command and choose &quot;Save as PDF&quot; to keep a copy.
        </p>
        <label className="option">
          <input
            type="checkbox"
            checked={includePart2}
            onChange={(e) => setIncludePart2(e.target.checked)}
          />
          <span>Include Part 2 (optional): the ASD Essentials transition summary</span>
        </label>
        <div className="button-row">
          <button type="button" className="button" onClick={() => window.print()}>
            Print or save as PDF
          </button>
          <a className="button button--secondary" href={href(paths.results)}>
            Back to results
          </a>
        </div>
      </div>

      <section className="report__cover" aria-labelledby="report-title">
        {isDemo && <p className="report__demo">{DEMO_LABEL}</p>}
        <h1 id="report-title" ref={headingRef} tabIndex={-1}>
          Essential Eight self-assessment report
        </h1>
        <dl className="details-list">
          <dt>Organisation</dt>
          <dd>{organisation || 'Not named'}</dd>
          <dt>Date</dt>
          <dd>{reportDate(now)}</dd>
          <dt>Target</dt>
          <dd>{LEVEL_NAMES[target]}</dd>
        </dl>
        <p className="report__status">Self-assessment, not an official assessment.</p>
        <p className="disclaimer">
          <strong>Important:</strong> {DISCLAIMER}
        </p>
        <p className="lead">{headlineText(e8)}</p>
        <p>{HEADLINE_EXPLANATION}</p>
      </section>

      <section className="report__part" aria-labelledby="part-1">
        <FrameworkTag framework="e8" />
        <h2 id="part-1">Part 1: your Essential Eight result</h2>
        <Suspense fallback={<p className="muted">Loading chart…</p>}>
          <StrategyRadarChart e8={e8} forPrint />
        </Suspense>
        <table className="report-table">
          <caption>Essential Eight maturity by strategy (target: {LEVEL_NAMES[target]})</caption>
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
        <ActionListSection list={actionList} headingLevel={3} alwaysShowAll />
        <EvidenceSection requests={evidence} headingLevel={3} />
        <ExceptionsSection items={exceptions} productGroups={productGroups} headingLevel={3} />
      </section>

      {includePart2 && (
        <section className="report__part" aria-labelledby="part-2">
          <FrameworkTag framework="essentials" />
          <h2 id="part-2">Part 2 (optional): how this carries into ASD Essentials</h2>
          <TransitionSummary transition={transition} />
        </section>
      )}

      <section className="report__part report__method" aria-labelledby="method">
        <h2 id="method">Method and sources</h2>
        <ul>
          <li>
            Each Essential Eight strategy is at a maturity level only when every requirement at that
            level and below is met. Only &quot;Yes&quot;, a justified &quot;Does not apply&quot; or
            an approved exception counts as met; &quot;Partly&quot; and &quot;Not sure&quot; do not.
          </li>
          <li>
            Only requirements up to the chosen target are asked, and no result is above the target.
            Once a requirement is not met, higher questions in that strategy are optional.
          </li>
          <li>
            The headline is the lowest strategy level, because ASD recommends reaching each level
            across all eight strategies before moving to the next.
          </li>
          <li>
            The ASD Essentials summary is indicative. It is built on ASD&apos;s own transition
            mapping and never converts Essential Eight levels into ASD Essentials ratings. The
            roll-up to principles, effort estimates and action ordering are our own rules.
          </li>
          <li>Data checked against the official documents on {meta.dataCheckedOn}.</li>
        </ul>
        <p>Sources (cyber.gov.au and asd.gov.au):</p>
        <ul className="report__sources">
          {meta.documents.map((d) => (
            <li key={d.url}>
              <a href={d.url}>{d.name}</a>
            </li>
          ))}
        </ul>
        <p>
          {meta.frameworks.map((f) => `${f.name} (${f.version})`).join('; ')}.{' '}
          {meta.licence.attribution} Not affiliated with or endorsed by ASD or the ACSC.
        </p>
      </section>

      {/* Repeated at the bottom of every printed page by the print stylesheet. */}
      <p className="print-footer">{footer}</p>
    </div>
  );
}
