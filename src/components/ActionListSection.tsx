import { useId, useState } from 'react';
import { ANSWER_LABELS, LEVEL_NAMES, actionListCoverageNote } from '../lib/text.ts';
import type { ActionItem, ActionList } from '../lib/types.ts';

const TOP = 5;
const EFFORT_LABEL = {
  'quick-win': 'Quick win',
  moderate: 'Moderate',
  project: 'Project',
} as const;
const EXPOSURE_LABEL = {
  boundary: 'Internet-facing',
  identity: 'Identity and access',
  other: null,
} as const;

/** The prioritised action list: the top five, with the rest one click away. */
export function ActionListSection({ list }: { list: ActionList }) {
  const [showAll, setShowAll] = useState(false);
  const id = useId();
  const coverage = actionListCoverageNote(list.notNeededCount, list.skippedCount);
  const shown = showAll ? list.items : list.items.slice(0, TOP);

  return (
    <section aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>{list.title}</h2>
      {list.advice && <p className="notice">{list.advice}</p>}
      <p className="muted">
        Ordered by maturity level, then internet-facing and identity requirements, then effort.
        Effort is our own rough estimate, not ASD&apos;s.
      </p>
      {coverage && <p className="muted">{coverage}</p>}

      {list.items.length === 0 ? (
        <p>No actions: every answered requirement up to your target is met.</p>
      ) : (
        <>
          <ol id={`${id}-list`} className="item-list">
            {shown.map((item) => (
              <ActionCard key={item.requirement.id} item={item} />
            ))}
          </ol>
          {list.items.length > TOP && (
            <button
              type="button"
              className="button button--secondary"
              aria-expanded={showAll}
              aria-controls={`${id}-list`}
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? `Show the top ${TOP} only` : `Show all ${list.items.length} actions`}
            </button>
          )}
        </>
      )}
    </section>
  );
}

function ActionCard({ item }: { item: ActionItem }) {
  const r = item.requirement;
  const exposure = EXPOSURE_LABEL[r.exposure];
  return (
    <li className="item">
      <p className="item__title">{r.plainText}</p>
      <p className="item__meta">
        <span className="badge">{r.id}</span> {LEVEL_NAMES[item.level]} · {r.strategies.join(', ')}{' '}
        · Your answer: {ANSWER_LABELS[item.answer]}
      </p>
      <p>
        <strong>Why it matters:</strong> {r.whyItMatters}
      </p>
      <p>
        <strong>Next step:</strong> {item.nextStep}
      </p>
      <p className="item__tags">
        <span className="tag">Effort (our estimate): {EFFORT_LABEL[r.effort]}</span>
        {exposure && <span className="tag">{exposure}</span>}
      </p>
      {item.relatedPrinciples.length > 0 && (
        <p className="muted">
          Related ASD Essentials principles:{' '}
          {item.relatedPrinciples.map((p) => `${p.id} ${p.title}`).join('; ')}
        </p>
      )}
    </li>
  );
}
