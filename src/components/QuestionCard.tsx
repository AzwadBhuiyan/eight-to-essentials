import { useId } from 'react';
import type { E8Requirement, ProductGroup, Strategy } from '../data/types.ts';
import { answerProblems } from '../lib/answers.ts';
import { ANSWER_LABELS, LEVEL_NAMES, NOT_NEEDED_NOTE } from '../lib/text.ts';
import type { Answer, AnswerValue } from '../lib/types.ts';

interface Props {
  requirement: E8Requirement;
  /** The answer that counts: the user's own, or one from a product group. */
  answer: Answer | undefined;
  /** Set when the answer came from a product group rather than the user. */
  fromGroup: ProductGroup | null;
  /** The strategy whose step this question is shown in. Other strategies are listed as shared. */
  strategy: Strategy;
  skipped: boolean;
  /** True when no strategy needs this question for its current level (methodology D30). */
  notNeeded: boolean;
  onChange: (answer: Answer) => void;
  onSkip: () => void;
  onUnskip: () => void;
}

const SIMPLE_VALUES = ['yes', 'partly', 'no', 'not-sure'] as const;

/** Keeps any reason already typed when switching between "Does not apply" and an exception. */
function startAnswer(value: AnswerValue, previous: Answer | undefined): Answer {
  const reason = previous && 'reason' in previous ? previous.reason : '';
  if (value === 'not-applicable') return { value, reason };
  if (value === 'exception') {
    return previous?.value === 'exception'
      ? previous
      : { value, reason, compensatingControl: '', approvedBy: '', reviewDate: '' };
  }
  return { value };
}

function levelsText(levels: E8Requirement['levels']): string {
  return levels.map((l) => LEVEL_NAMES[l].replace('Maturity Level ', '')).join(', ');
}

export function QuestionCard({
  requirement: r,
  answer,
  fromGroup,
  strategy,
  skipped,
  notNeeded,
  onChange,
  onSkip,
  onUnskip,
}: Props) {
  const id = useId();
  const name = `answer-${r.id}`;
  const otherStrategies = r.strategies.filter((s) => s !== strategy);
  const options: AnswerValue[] = [
    ...SIMPLE_VALUES,
    ...(r.naAllowed ? (['not-applicable'] as const) : []),
    'exception',
  ];
  // A group answer has no own reason box, so its problems are shown on the group instead.
  const problems = answer && !fromGroup ? answerProblems(r, answer) : [];
  const classes = [
    'question',
    notNeeded && !answer ? 'question--optional' : '',
    skipped ? 'question--skipped' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <fieldset className={classes} aria-describedby={`${id}-meta`}>
      <legend className="question__text">{r.plainText}</legend>
      {r.conditions.length > 0 && (
        <ul className="question__conditions">
          {r.conditions.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      )}
      {r.helpText && <p className="question__help">{r.helpText}</p>}
      <p id={`${id}-meta`} className="question__meta">
        <span className="badge">{r.id}</span> Maturity Level {levelsText(r.levels)}.{' '}
        {otherStrategies.length > 0 && (
          <>Shared requirement: also counts for {otherStrategies.join(', ')}. </>
        )}
        <a href={r.source.url} rel="noopener noreferrer" target="_blank">
          {r.source.document}
        </a>
        , {r.source.locations[0]}.
      </p>

      {notNeeded && !answer && <p className="question__note">{NOT_NEEDED_NOTE}</p>}
      {skipped && !answer && (
        <p className="question__note">
          <strong>Skipped for now.</strong> This question counts as unanswered.
        </p>
      )}
      {fromGroup && (
        <p className="question__note">
          Answered &quot;Does not apply&quot; by your answer &quot;{fromGroup.label}&quot;. Choose
          another option to override it for this question only.
        </p>
      )}

      <div className="question__options">
        {options.map((value) => (
          <label key={value} className="option">
            <input
              type="radio"
              name={name}
              value={value}
              checked={answer?.value === value}
              onChange={() => onChange(startAnswer(value, fromGroup ? undefined : answer))}
            />
            <span>{ANSWER_LABELS[value]}</span>
          </label>
        ))}
      </div>

      {!answer && (
        <button type="button" className="button button--link" onClick={skipped ? onUnskip : onSkip}>
          {skipped ? 'Undo skip' : 'Skip for now'}
        </button>
      )}

      {answer?.value === 'not-applicable' && !fromGroup && (
        <div className="question__details">
          {r.naGuidance && <p className="muted">Use this only when: {r.naGuidance}</p>}
          <label htmlFor={`${id}-na-reason`}>Why does this not apply? (required)</label>
          <textarea
            id={`${id}-na-reason`}
            value={answer.reason}
            maxLength={2000}
            onChange={(e) => onChange({ ...answer, reason: e.target.value })}
          />
        </div>
      )}

      {answer?.value === 'exception' && (
        <div className="question__details">
          <p className="muted">
            ASD expects exceptions to be kept to a minimum, documented, approved, supported by
            compensating controls and reviewed regularly.
          </p>
          <label htmlFor={`${id}-ex-reason`}>Reason for the exception (required)</label>
          <textarea
            id={`${id}-ex-reason`}
            value={answer.reason}
            maxLength={2000}
            onChange={(e) => onChange({ ...answer, reason: e.target.value })}
          />
          <label htmlFor={`${id}-ex-control`}>Compensating control (required)</label>
          <textarea
            id={`${id}-ex-control`}
            value={answer.compensatingControl}
            maxLength={2000}
            onChange={(e) => onChange({ ...answer, compensatingControl: e.target.value })}
          />
          <label htmlFor={`${id}-ex-approver`}>Approved by (required)</label>
          <input
            id={`${id}-ex-approver`}
            type="text"
            value={answer.approvedBy}
            maxLength={200}
            onChange={(e) => onChange({ ...answer, approvedBy: e.target.value })}
          />
          <label htmlFor={`${id}-ex-date`}>Review date (required)</label>
          <input
            id={`${id}-ex-date`}
            type="date"
            value={answer.reviewDate}
            onChange={(e) => onChange({ ...answer, reviewDate: e.target.value })}
          />
        </div>
      )}

      {problems.length > 0 && (
        <div className="question__problems" role="status">
          <p>
            <strong>Still needed before this answer counts:</strong>
          </p>
          <ul>
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      <details>
        <summary>Why it matters</summary>
        <p>{r.whyItMatters}</p>
      </details>
      <details>
        <summary>Evidence that would show this</summary>
        <ul>
          {r.evidence.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </details>
    </fieldset>
  );
}
