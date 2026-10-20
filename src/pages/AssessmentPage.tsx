import { DataControls } from '../components/DataControls.tsx';
import { QuestionCard } from '../components/QuestionCard.tsx';
import { usePageFocus } from '../components/usePageFocus.ts';
import { e8Requirements } from '../data/index.ts';
import { STRATEGIES, type E8Requirement, type MaturityLevel } from '../data/types.ts';
import { validAnswerFor } from '../lib/answers.ts';
import { lowestLevel } from '../lib/scoring.ts';
import { ANSWER_LABELS, LEVEL_NAMES } from '../lib/text.ts';
import type { Answer } from '../lib/types.ts';
import { href } from '../router.ts';
import { useAssessment } from '../state/assessmentContext.ts';

const LEVELS: MaturityLevel[] = [1, 2, 3];

/**
 * A shared control is asked once, under the first strategy (in ASD's order) it belongs to.
 * The other strategies show a short note pointing back to it.
 */
const homeStrategy = (r: E8Requirement) => r.strategies[0];

export function AssessmentPage({ step }: { step: number }) {
  const { state, dispatch } = useAssessment();
  const strategy = STRATEGIES[step - 1]!;
  const headingRef = usePageFocus<HTMLHeadingElement>(`Step ${step}: ${strategy}`);

  const requirements = e8Requirements
    .filter((r) => r.strategies.includes(strategy))
    .sort((a, b) => lowestLevel(a) - lowestLevel(b)); // stable: keeps the data order within a level

  const answeredTotal = e8Requirements.filter((r) => validAnswerFor(r, state.answers)).length;
  const answeredHere = requirements.filter((r) => validAnswerFor(r, state.answers)).length;
  const isLast = step === STRATEGIES.length;

  return (
    <>
      <p className="muted">
        Step {step} of {STRATEGIES.length}
      </p>
      <h1 ref={headingRef} tabIndex={-1}>
        {strategy}
      </h1>
      <div className="progress">
        <label htmlFor="overall-progress">
          {answeredTotal} of {e8Requirements.length} questions answered overall ({answeredHere} of{' '}
          {requirements.length} in this step)
        </label>
        <progress id="overall-progress" max={e8Requirements.length} value={answeredTotal} />
      </div>
      <p>
        Answer &quot;Yes&quot; only if you could show evidence. &quot;Partly&quot; and &quot;Not
        sure&quot; do not count as met.
      </p>

      {LEVELS.map((level) => {
        const atLevel = requirements.filter((r) => lowestLevel(r) === level);
        if (atLevel.length === 0) return null;
        return (
          <section key={level} aria-labelledby={`level-${level}`}>
            <h2 id={`level-${level}`}>{LEVEL_NAMES[level]}</h2>
            {atLevel.map((r) =>
              homeStrategy(r) === strategy ? (
                <QuestionCard
                  key={r.id}
                  requirement={r}
                  answer={state.answers[r.id]}
                  strategy={strategy}
                  onChange={(answer) => dispatch({ type: 'set-answer', id: r.id, answer })}
                />
              ) : (
                <SharedNote key={r.id} requirement={r} answer={validAnswerFor(r, state.answers)} />
              ),
            )}
          </section>
        );
      })}

      <nav className="step-nav" aria-label="Assessment steps">
        <a
          className="button button--secondary"
          href={href(step === 1 ? '/context' : `/assessment/${step - 1}`)}
        >
          Back
        </a>
        <a className="button" href={href(isLast ? '/results' : `/assessment/${step + 1}`)}>
          {isLast ? 'See results' : `Next: ${STRATEGIES[step]}`}
        </a>
      </nav>

      <DataControls />
    </>
  );
}

/** Shown in place of a shared question under every strategy except the one that asks it. */
function SharedNote({
  requirement: r,
  answer,
}: {
  requirement: E8Requirement;
  answer: Answer | undefined;
}) {
  const home = homeStrategy(r)!;
  const homeStep = STRATEGIES.indexOf(home) + 1;
  return (
    <div className="question question--shared">
      <p className="question__text">{r.plainText}</p>
      <p className="question__meta">
        <span className="badge">{r.id}</span> Shared requirement, asked under{' '}
        <a href={href(`/assessment/${homeStep}`)}>{home}</a>. Your answer:{' '}
        <strong>{answer ? ANSWER_LABELS[answer.value] : 'not answered yet'}</strong>.
      </p>
    </div>
  );
}
