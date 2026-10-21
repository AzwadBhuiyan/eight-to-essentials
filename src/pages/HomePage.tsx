import { Disclaimer } from '../components/Disclaimer.tsx';
import { usePageFocus } from '../components/usePageFocus.ts';
import { e8Requirements } from '../data/index.ts';
import { inScope } from '../lib/effective.ts';
import {
  EXPLAINER,
  HOME_HEADLINE,
  HOW_IT_WORKS,
  NOT_AFFILIATED,
  TIME_ESTIMATE,
  TRUST_DOCUMENTS,
} from '../lib/siteText.ts';
import { href } from '../router.ts';

// The default target is Maturity Level One; the count comes from the data so it never drifts.
const DEFAULT_TARGET_QUESTIONS = inScope(e8Requirements, 1).length;

/** Home page (methodology D36). */
export function HomePage() {
  const headingRef = usePageFocus<HTMLHeadingElement>('Eight to Essentials');
  return (
    <>
      <h1 ref={headingRef} tabIndex={-1}>
        {HOME_HEADLINE}
      </h1>
      <p className="lead">
        A free self-assessment that runs in your browser. No accounts, no tracking.
      </p>

      <div className="button-row">
        <a className="button" href={href('/context')}>
          Start my assessment
        </a>
        <a className="button button--secondary" href={href('/example')}>
          See an example result
        </a>
      </div>

      {/* Phase 7 fills this with the fictional demo company's real result. */}
      <section className="card card--placeholder" aria-labelledby="example-preview">
        <p className="placeholder-label" id="example-preview">
          Example preview: coming soon
        </p>
        <p className="muted">
          A fictional example company&apos;s radar chart and headline result will appear here.
        </p>
      </section>

      <section aria-labelledby="how-it-works">
        <h2 id="how-it-works">How it works</h2>
        <ol className="steps">
          {HOW_IT_WORKS.map((step, i) => (
            <li key={step} className="card steps__item">
              <span className="steps__number" aria-hidden="true">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="what-these-are">
        <h2 id="what-these-are">The Essential Eight and ASD Essentials</h2>
        <ul className="explainer">
          {EXPLAINER.map((s) => (
            <li key={s.text}>
              {s.text}
              {s.sources.map((src) => (
                <span key={src.label}>
                  {' '}
                  <a
                    className="source-link"
                    href={src.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    ({src.label})
                  </a>
                </span>
              ))}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="expect">
        <h2 id="expect">What to expect</h2>
        <ul>
          <li>
            {DEFAULT_TARGET_QUESTIONS} questions at the default target (Maturity Level One), often
            fewer.
          </li>
          <li>{TIME_ESTIMATE}</li>
          <li>Save your progress on this device and come back later, or export your answers.</li>
          <li>Nothing you enter leaves your browser.</li>
        </ul>
      </section>

      <Disclaimer />

      <section className="trust" aria-labelledby="trust">
        <h2 id="trust" className="trust__title">
          Built on ASD&apos;s publicly available guidance
        </h2>
        <ul>
          {TRUST_DOCUMENTS.map((d) => (
            <li key={d.url}>
              <a href={d.url} rel="noopener noreferrer" target="_blank">
                {d.label}
              </a>{' '}
              (cyber.gov.au)
            </li>
          ))}
        </ul>
        <p>
          ASD material © Commonwealth of Australia, used under the{' '}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            rel="noopener noreferrer"
            target="_blank"
          >
            Creative Commons Attribution 4.0 licence
          </a>
          .
        </p>
        <p>
          <strong>{NOT_AFFILIATED}</strong>
        </p>
      </section>
    </>
  );
}
