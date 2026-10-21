import { useId } from 'react';
import { JourneySteps } from '../components/JourneySteps.tsx';
import { usePageFocus } from '../components/usePageFocus.ts';
import { ProductGroupsField } from '../components/ProductGroupsField.tsx';
import { e8Requirements } from '../data/index.ts';
import type { MaturityLevel } from '../data/types.ts';
import { inScope } from '../lib/effective.ts';
import { CLOUD_CHAPTER_NOTICE, LEVEL_NAMES, TARGET_HINT, TARGET_HINT_SOURCE } from '../lib/text.ts';
import type { E8ReportingRequired, SystemsLocation } from '../lib/types.ts';
import { href } from '../router.ts';
import { useAssessment } from '../state/assessmentContext.ts';

const REPORTING_OPTIONS: { value: E8ReportingRequired; label: string }[] = [
  { value: 'yes', label: 'Yes, for a contract, insurer or government customer' },
  { value: 'no', label: 'No' },
  { value: 'not-sure', label: 'Not sure' },
];

// Question counts come from the data, so they always match what the wizard asks.
const TARGET_OPTIONS = ([1, 2, 3] as MaturityLevel[]).map((value) => ({
  value,
  questions: inScope(e8Requirements, value).length,
}));

const SYSTEMS_OPTIONS: { value: SystemsLocation; label: string }[] = [
  { value: 'own-hybrid-iaas', label: 'Our own servers, a hybrid environment, or IaaS' },
  { value: 'saas-paas', label: 'Almost entirely SaaS and PaaS' },
  { value: 'not-sure', label: 'Not sure' },
];

export function ContextPage() {
  const { state, dispatch } = useAssessment();
  const { context } = state;
  const id = useId();
  const headingRef = usePageFocus<HTMLHeadingElement>('About your organisation');
  const update = (change: Partial<typeof context>) =>
    dispatch({ type: 'set-context', context: { ...context, ...change } });

  return (
    <>
      <JourneySteps current={1} />
      <h1 ref={headingRef} tabIndex={-1}>
        About your organisation
      </h1>
      <p>
        A few quick questions before the assessment. They set what you are asked and how your
        results are framed.
      </p>

      <div className="form-field">
        <label htmlFor={`${id}-org`}>Organisation name (optional)</label>
        <p id={`${id}-org-hint`} className="muted">
          Only shown on your report. It stays in your browser.
        </p>
        <input
          id={`${id}-org`}
          type="text"
          value={context.organisationName}
          maxLength={200}
          autoComplete="organization"
          aria-describedby={`${id}-org-hint`}
          onChange={(e) => update({ organisationName: e.target.value })}
        />
      </div>

      <fieldset className="form-field">
        <legend>Are you still required to report Essential Eight maturity?</legend>
        {REPORTING_OPTIONS.map((o) => (
          <label key={o.value} className="option">
            <input
              type="radio"
              name="e8-reporting"
              value={o.value}
              checked={context.e8ReportingRequired === o.value}
              onChange={() => update({ e8ReportingRequired: o.value })}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="form-field">
        <legend>Where do your systems mainly run?</legend>
        {SYSTEMS_OPTIONS.map((o) => (
          <label key={o.value} className="option">
            <input
              type="radio"
              name="systems-location"
              value={o.value}
              checked={context.systemsLocation === o.value}
              onChange={() => update({ systemsLocation: o.value })}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </fieldset>

      <div aria-live="polite">
        {context.systemsLocation === 'saas-paas' && (
          <p className="notice">
            {CLOUD_CHAPTER_NOTICE}{' '}
            <a
              href="https://www.cyber.gov.au/publication/which-chapter-should-i-start-with"
              rel="noopener noreferrer"
              target="_blank"
            >
              Which chapter should I start with? (cyber.gov.au)
            </a>
          </p>
        )}
      </div>

      <fieldset className="form-field" aria-describedby={`${id}-target-hint`}>
        <legend>Which maturity level are you aiming for?</legend>
        <p id={`${id}-target-hint`} className="muted">
          You are only asked about requirements up to this level, and results never go above it.{' '}
          {TARGET_HINT} (
          <a href={TARGET_HINT_SOURCE.url} rel="noopener noreferrer" target="_blank">
            {TARGET_HINT_SOURCE.text}
          </a>
          )
        </p>
        {TARGET_OPTIONS.map((o) => (
          <label key={o.value} className="option">
            <input
              type="radio"
              name="target-level"
              value={o.value}
              checked={context.targetLevel === o.value}
              onChange={() => update({ targetLevel: o.value })}
            />
            <span>
              {LEVEL_NAMES[o.value]} ({o.questions} questions at most)
            </span>
          </label>
        ))}
      </fieldset>

      <ProductGroupsField target={context.targetLevel} />

      <p>
        <a className="button" href={href('/assessment/1')}>
          Continue to the assessment
        </a>
      </p>
    </>
  );
}
