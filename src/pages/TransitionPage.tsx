import { useMemo } from 'react';
import { Disclaimer } from '../components/Disclaimer.tsx';
import { FrameworkTag } from '../components/FrameworkTag.tsx';
import { JourneySteps } from '../components/JourneySteps.tsx';
import { PartsSummary } from '../components/PartsSummary.tsx';
import { TransitionDomain } from '../components/TransitionDomain.tsx';
import { usePageFocus } from '../components/usePageFocus.ts';
import {
  e8Requirements,
  e8ToEssentialsMap,
  essentialsStructure,
  frameworkData,
} from '../data/index.ts';
import { strategyResultText } from '../lib/resultsText.ts';
import { LEVEL_NAMES, ROLLUP_RULE_NOTE, TRANSITION_BANNER } from '../lib/text.ts';
import { buildTransition } from '../lib/transition.ts';
import {
  INCOMPLETE_TRANSITION_NOTE,
  PRIORITY_PHASE_HEADINGS,
  TRANSITION_TITLE,
  TRANSITION_VIEW_LABEL,
  noActionMappingText,
} from '../lib/transitionText.ts';
import { href } from '../router.ts';
import { useAssessment } from '../state/assessmentContext.ts';
import { useDerived } from '../state/useDerived.ts';

const TRANSITION_URL =
  'https://www.cyber.gov.au/publication/transitioning-from-the-essential-eight';

const actionsById = new Map(essentialsStructure.actions.map((a) => [a.id, a]));
const domainByName = new Map(essentialsStructure.domains.map((d) => [d.name, d]));
const principleTitle = new Map(essentialsStructure.principles.map((p) => [p.id, p.title]));
const requirementText = new Map(e8Requirements.map((r) => [r.id, r.plainText]));

/**
 * The optional transition view (methodology D33): an indicative gap analysis built on ASD's own
 * mapping tables. It never converts Essential Eight levels into ASD Essentials ratings.
 */
export function TransitionPage() {
  const { state } = useAssessment();
  const { e8, effective, target } = useDerived(state);
  const headingRef = usePageFocus<HTMLHeadingElement>(TRANSITION_TITLE);
  const transition = useMemo(
    () => buildTransition(frameworkData, e8, effective.answers),
    [e8, effective],
  );
  const anyIncomplete = e8.strategies.some((s) => s.status === 'incomplete');
  const anyAnswered = Object.keys(effective.answers).length > 0;

  // Domains are already in priority order (methodology D26); group them under phase headings.
  const phases = [1, 'all', 2, 3] as const;

  return (
    <>
      <JourneySteps current={3} />
      <FrameworkTag framework="essentials" />
      <h1 ref={headingRef} tabIndex={-1}>
        {TRANSITION_TITLE}
      </h1>
      <PartsSummary current={2} />
      <p className="lead">How your Essential Eight results may carry into ASD Essentials.</p>
      <p className="view-label" role="note">
        {TRANSITION_VIEW_LABEL} <a href={href('/results')}>See your Essential Eight result</a>.
      </p>
      <p className="notice">
        <strong>{TRANSITION_BANNER}</strong>
      </p>
      <Disclaimer />
      {anyIncomplete && <p className="muted">{INCOMPLETE_TRANSITION_NOTE}</p>}

      {!anyAnswered ? (
        <p>
          Answer the Essential Eight questions first.{' '}
          <a href={href('/context')}>Start the assessment</a>.
        </p>
      ) : (
        <>
          <section aria-labelledby="how-to-read">
            <h2 id="how-to-read">How to read this ASD Essentials view</h2>
            <p>
              For each ASD Essentials action, ASD&apos;s transition tables say which Essential Eight
              strategy and maturity level contributes, and whether fully or only in part. This page
              compares that with your results (target: {LEVEL_NAMES[target]}).
            </p>
            <ul>
              <li>
                <strong>May contribute:</strong> your Essential Eight evidence may be reusable.
                Check it is current, shows the action is effective (not just deployed) and covers
                the domain.
              </li>
              <li>
                <strong>Partial coverage in a domain:</strong> ASD says your Essential Eight work
                covers only part of the action there, even where its note sounds positive.
              </li>
              <li>
                <strong>Gap:</strong> your result for the strategy is below the level ASD lists.
              </li>
              <li>
                <strong>Not assessed (above your target):</strong> ASD lists a level higher than the
                target you chose.
              </li>
              <li>
                <strong>E8 evidence to check</strong> and <strong>No E8 mapping</strong> are
                statements about ASD&apos;s mapping, not about your organisation.
              </li>
            </ul>
            <p className="muted">{ROLLUP_RULE_NOTE}</p>
          </section>

          <section aria-labelledby="by-domain">
            <h2 id="by-domain">ASD Essentials by domain and priority phase</h2>
            {phases.map((phase) => {
              const groups = transition.domains.filter((d) => d.priorityPhase === phase);
              if (groups.length === 0) return null;
              return (
                <div key={String(phase)} className="phase">
                  <h3>{PRIORITY_PHASE_HEADINGS[phase]}</h3>
                  {groups.map((g) => (
                    <TransitionDomain
                      key={g.domain}
                      group={g}
                      domain={domainByName.get(g.domain)!}
                      actionsById={actionsById}
                      requirementText={requirementText}
                      target={target}
                      open={phase === 1}
                    />
                  ))}
                </div>
              );
            })}
          </section>

          <section aria-labelledby="not-covered">
            <h2 id="not-covered">ASD Essentials actions not covered by the Essential Eight</h2>
            <p>
              These ASD Essentials actions have no Essential Eight equivalent, so they need new work
              whatever your Essential Eight results.
            </p>
            {transition.notCovered.map((g) => (
              <details key={g.domain} className="domain" open={g.priorityPhase === 1}>
                <summary>
                  <span className="domain__name">ASD Essentials domain: {g.domain}</span>{' '}
                  <span className="muted">({PRIORITY_PHASE_HEADINGS[g.priorityPhase]})</span>
                </summary>
                {g.principles.map((p) => (
                  <div key={p.principleId}>
                    <p className="item__title">
                      ASD Essentials principle <span className="badge">{p.principleId}</span>{' '}
                      {p.title}
                    </p>
                    <ul>
                      {p.actionIds.map((id) => (
                        <li key={id}>
                          ASD Essentials action <span className="badge">{id}</span>{' '}
                          {actionsById.get(id)?.summary}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </details>
            ))}
          </section>

          <section aria-labelledby="strengthen">
            <h2 id="strengthen">
              ASD Essentials: where your Essential Eight work may need strengthening
            </h2>
            <p>
              ASD&apos;s points for each strategy, paraphrased. They apply even where your Essential
              Eight results are strong.
            </p>
            {e8ToEssentialsMap.strengthen.map((group) => (
              <div key={group.strategies.join()} className="item">
                <p className="item__title">
                  Essential Eight strategy: {group.strategies.join(' and ')}
                </p>
                <p className="item__meta">
                  Your Essential Eight result:{' '}
                  {group.strategies
                    .map((s) => strategyResultText(e8.strategies.find((x) => x.strategy === s)!))
                    .join('; ')}
                </p>
                <ul>
                  {group.points.map((p) => (
                    <li key={p.topic}>
                      <strong>{p.topic}:</strong> {p.text}
                    </li>
                  ))}
                </ul>
                {e8ToEssentialsMap.strategies
                  .filter((s) => group.strategies.includes(s.strategy))
                  .flatMap((s) => s.principlesWithoutActionMapping)
                  .filter((id, i, all) => all.indexOf(id) === i)
                  .map((id) => (
                    <p key={id} className="muted">
                      {noActionMappingText(principleTitle.get(id) ?? id)}
                    </p>
                  ))}
                <p className="muted">
                  Source:{' '}
                  <a href={TRANSITION_URL} rel="noopener noreferrer" target="_blank">
                    Transitioning from the Essential Eight
                  </a>
                  , {group.source.location}.
                </p>
              </div>
            ))}
            <div className="item">
              <p className="item__title">Essential Eight event logging, detection and response</p>
              <p className="item__meta">
                Shared by several strategies. ASD maps these to the Visibility and response domain
                and gives no action table.
              </p>
              <ul>
                {e8ToEssentialsMap.eventLoggingDetectionAndResponse.strengthen.map((p) => (
                  <li key={p.topic}>
                    <strong>{p.topic}:</strong> {p.text}
                  </li>
                ))}
              </ul>
              <p className="muted">
                Source: Transitioning from the Essential Eight,{' '}
                {e8ToEssentialsMap.eventLoggingDetectionAndResponse.source.location}.
              </p>
            </div>
          </section>

          <section aria-labelledby="next-steps">
            <h2 id="next-steps">ASD Essentials: ASD&apos;s recommended next steps</h2>
            <p>Paraphrased from Transitioning from the Essential Eight, pages 22 to 23:</p>
            <ol>
              <li>
                Record where you stand today: your latest Essential Eight results, controls,
                exceptions, risks and planned work. Avoid starting work only to reach a superseded
                Essential Eight target, unless an obligation still requires it or it still reduces
                material risk.
              </li>
              <li>
                Identify the assets and functions in the priority phase 1 domains: Governance and
                culture, Visibility and response, Boundary services and Identity services.
              </li>
              <li>
                For each applicable principle, review its actions against your existing controls and
                record each as already effectively addressed, partially addressed or not addressed.
                These are gap findings, not ratings.
              </li>
              <li>Plan the work to close the gaps.</li>
              <li>
                Deliver it and prepare for assessment, considering coverage, consistency, currency
                and evidence quality for each action and domain.
              </li>
              <li>Move on to priority phases 2 and 3, and reassess regularly.</li>
            </ol>
            <p>
              <a href={TRANSITION_URL} rel="noopener noreferrer" target="_blank">
                Read Transitioning from the Essential Eight (cyber.gov.au)
              </a>
            </p>
          </section>
        </>
      )}

      <p className="button-row">
        <a className="button button--secondary" href={href('/results')}>
          Back to Essential Eight results
        </a>
      </p>
    </>
  );
}
