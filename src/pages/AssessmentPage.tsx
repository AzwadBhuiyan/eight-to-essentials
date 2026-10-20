import { DataControls } from '../components/DataControls.tsx';
import { QuestionCard } from '../components/QuestionCard.tsx';
import { usePageFocus } from '../components/usePageFocus.ts';
import { productGroups } from '../data/index.ts';
import { STRATEGIES, type E8Requirement, type MaturityLevel } from '../data/types.ts';
import { validAnswerFor } from '../lib/answers.ts';
import { lowestLevel } from '../lib/scoring.ts';
import { ANSWER_LABELS, LEVEL_NAMES } from '../lib/text.ts';
import type { Answer } from '../lib/types.ts';
import { href } from '../router.ts';
import { useAssessment } from '../state/assessmentContext.ts';
import { useDerived } from '../state/useDerived.ts';

const LEVELS: MaturityLevel[] = [1, 2, 3];
const groupById = new Map(productGroups.map((g) => [g.id, g]));

/**
 * A shared control is asked once, under the first strategy (in ASD's order) it belongs to.
 * The other strategies show a short note pointing back to it.
 */
const homeStrategy = (r: E8Requirement) => r.strategies[0];

export function AssessmentPage({ step }: { step: number }) {
  const { state, dispatch } = useAssessment();
  const derived = useDerived(state);
  const { target, effective, asked, answeredIds, notNeededIds, requiredLeft } = derived;
  const strategy = STRATEGIES[step - 1]!;
  const headingRef = usePageFocus<HTMLHeadingElement>(`Step ${step}: ${strategy}`);

  const requirements = asked
    .filter((r) => r.strategies.includes(strategy))
    .sort((a, b) => lowestLevel(a) - lowestLevel(b)); // stable: keeps the data order within a level
  const strategyResult = derived.e8.strategies.find((s) => s.strategy === strategy)!;
  const skippedLeft = state.skipped.filter((id) => !answeredIds.has(id)).length;
  const isLast = step === STRATEGIES.length;

  return (
    <>
      <div className="step-header">
        <p className="muted">
          Step {step} of {STRATEGIES.length} · Target: {LEVEL_NAMES[target]}
        </p>
        <a className="button button--secondary" href={href('/results')}>
          See results so far
        </a>
      </div>
      <h1 ref={headingRef} tabIndex={-1}>
        {strategy}
      </h1>
      <div className="progress">
        <label htmlFor="overall-progress">
          {answeredIds.size} of {asked.length} questions answered. {requiredLeft} still needed
          {notNeededIds.size > 0 && `, ${notNeededIds.size} not needed for your current level`}
          {skippedLeft > 0 && `, ${skippedLeft} skipped`}.
        </label>
        <progress id="overall-progress" max={asked.length} value={answeredIds.size} />
      </div>
      <p>
        Answer &quot;Yes&quot; only if you could show evidence. &quot;Partly&quot; and &quot;Not
        sure&quot; do not count as met.
      </p>
      {strategyResult.status === 'complete' && (
        <p className="notice" role="status">
          This strategy is complete: {LEVEL_NAMES[strategyResult.level!]}
          {strategyResult.level === target ? ' (your target)' : ''}.
        </p>
      )}

      {LEVELS.filter((l) => l <= target).map((level) => {
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
                  answer={effective.answers[r.id]}
                  fromGroup={
                    effective.fromGroup[r.id]
                      ? (groupById.get(effective.fromGroup[r.id]!) ?? null)
                      : null
                  }
                  strategy={strategy}
                  skipped={state.skipped.includes(r.id)}
                  notNeeded={notNeededIds.has(r.id)}
                  onChange={(answer) => dispatch({ type: 'set-answer', id: r.id, answer })}
                  onSkip={() => dispatch({ type: 'skip', id: r.id })}
                  onUnskip={() => dispatch({ type: 'unskip', id: r.id })}
                />
              ) : (
                <SharedNote
                  key={r.id}
                  requirement={r}
                  answer={validAnswerFor(r, effective.answers)}
                />
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
