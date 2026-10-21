import { JOURNEY_STEPS } from '../lib/siteText.ts';
import { href } from '../router.ts';
import { useAssessment } from '../state/assessmentContext.ts';

/**
 * "Step 1 of 3: Essential Eight questions" and the other steps (methodology D38).
 * The current step is marked with aria-current, and with text, not just colour.
 */
export function JourneySteps({ current }: { current: 1 | 2 | 3 }) {
  const here = JOURNEY_STEPS[current - 1]!;
  const { paths } = useAssessment();
  const pathFor = { 1: paths.context, 2: paths.results, 3: paths.transition } as const;
  return (
    <nav className="journey" aria-label="Your progress">
      <p className="journey__current">
        Step {current} of {JOURNEY_STEPS.length}: {here.label}
      </p>
      <ol className="journey__steps">
        {JOURNEY_STEPS.map((s) => (
          <li key={s.step} className={s.step === current ? 'journey__step--current' : undefined}>
            {s.step === current ? (
              <span aria-current="step">
                {s.step}. {s.label}
              </span>
            ) : (
              <a href={href(pathFor[s.step])}>
                {s.step}. {s.label}
              </a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
