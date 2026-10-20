import { useId } from 'react';
import { e8Requirements, productGroups } from '../data/index.ts';
import type { MaturityLevel, ProductGroup } from '../data/types.ts';
import { inScope } from '../lib/effective.ts';
import { useAssessment } from '../state/assessmentContext.ts';

/**
 * "Products and services you don't use" (methodology D31). Ticking a group answers every
 * requirement naming that product as "Does not apply", with one shared reason.
 */
export function ProductGroupsField({ target }: { target: MaturityLevel }) {
  const asked = inScope(e8Requirements, target);
  return (
    <fieldset className="form-field">
      <legend>Products and services you don&apos;t use (optional)</legend>
      <p className="muted">
        Tick any that are true for your whole organisation. Each one answers several questions as
        &quot;Does not apply&quot;, with one reason. You can still change any of those answers
        later.
      </p>
      {productGroups.map((g) => {
        const count = asked.filter((r) => r.naGroup === g.id).length;
        return count > 0 ? <GroupOption key={g.id} group={g} count={count} /> : null;
      })}
    </fieldset>
  );
}

function GroupOption({ group, count }: { group: ProductGroup; count: number }) {
  const { state, dispatch } = useAssessment();
  const id = useId();
  const chosen = state.productGroups[group.id];

  return (
    <div className="group-option">
      <label className="option">
        <input
          type="checkbox"
          checked={chosen !== undefined}
          aria-describedby={`${id}-desc`}
          onChange={(e) =>
            dispatch(
              e.target.checked
                ? { type: 'set-group', groupId: group.id, reason: '' }
                : { type: 'remove-group', groupId: group.id },
            )
          }
        />
        <span>{group.label}</span>
      </label>
      <div id={`${id}-desc`} className="group-option__details">
        {group.helpText && (
          <p className="question__help">
            <strong>Check first:</strong> {group.helpText}
          </p>
        )}
        <p className="muted">
          {group.description} Covers {count} question{count === 1 ? '' : 's'} at your target.
        </p>
      </div>
      {chosen !== undefined && (
        <div className="question__details">
          <label htmlFor={`${id}-reason`}>Why is this true for your organisation? (required)</label>
          <textarea
            id={`${id}-reason`}
            value={chosen.reason}
            maxLength={2000}
            onChange={(e) =>
              dispatch({ type: 'set-group', groupId: group.id, reason: e.target.value })
            }
          />
          {chosen.reason.trim() === '' && (
            <p className="question__problems" role="status">
              Give a reason. Until you do, these questions are not answered.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
