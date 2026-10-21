import { lazy, Suspense } from 'react';
import { e8Requirements } from '../data/index.ts';
import { DEMO_LABEL, DEMO_PROFILE, DEMO_STATE } from '../lib/demo.ts';
import { effectiveAnswers } from '../lib/effective.ts';
import { headlineText } from '../lib/resultsText.ts';
import { scoreAll } from '../lib/scoring.ts';
import { href } from '../router.ts';

const StrategyRadarChart = lazy(() => import('./StrategyRadarChart.tsx'));

// The demo never changes, so its result is worked out once.
const demoResult = scoreAll(
  e8Requirements,
  effectiveAnswers(DEMO_STATE, e8Requirements).answers,
  DEMO_STATE.context.targetLevel,
);

/** Home page preview: the fictional demo company's real radar chart and headline. */
export function DemoPreview() {
  return (
    <section className="card demo-preview" aria-labelledby="example-preview">
      <p className="placeholder-label" id="example-preview">
        Example result: {DEMO_LABEL}
      </p>
      <p className="muted">
        {DEMO_PROFILE.name} is a fictional company used to show what you get. It is not a real
        organisation.
      </p>
      <p className="lead">{headlineText(demoResult)}</p>
      <Suspense fallback={<p className="muted">Loading chart…</p>}>
        <StrategyRadarChart e8={demoResult} />
      </Suspense>
      <p>
        <a href={href('/example')}>See the full example result</a>
      </p>
    </section>
  );
}
