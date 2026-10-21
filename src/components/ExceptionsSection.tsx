import { useId } from 'react';
import { FrameworkTag } from './FrameworkTag.tsx';
import type { ProductGroup } from '../data/types.ts';
import type { ExceptionItem } from '../lib/types.ts';

/**
 * "Exceptions to review": every "Does not apply" and exception answer, which count as met.
 * Answers from one product group are shown together instead of once per requirement.
 */
export function ExceptionsSection({
  items,
  productGroups,
}: {
  items: ExceptionItem[];
  productGroups: ProductGroup[];
}) {
  const id = useId();
  const exceptions = items.filter((i) => i.answer.value === 'exception');
  const single = items.filter((i) => i.answer.value === 'not-applicable' && !i.groupId);
  const grouped = productGroups
    .map((g) => ({ group: g, members: items.filter((i) => i.groupId === g.id) }))
    .filter((g) => g.members.length > 0);

  return (
    <section aria-labelledby={`${id}-heading`}>
      <FrameworkTag framework="e8" />
      <h2 id={`${id}-heading`}>Essential Eight: exceptions to review</h2>
      {items.length === 0 ? (
        <p>No exceptions or &quot;Does not apply&quot; answers.</p>
      ) : (
        <>
          <p className="notice">
            These count as met. ASD expects exceptions to be kept to a minimum, documented, approved
            through an appropriate process, supported by compensating controls and reviewed
            regularly.
          </p>
          <ul className="item-list">
            {exceptions.map((item) =>
              item.answer.value === 'exception' ? (
                <li key={item.requirement.id} className="item">
                  <p className="item__title">{item.requirement.plainText}</p>
                  <p className="item__meta">
                    <span className="badge">{item.requirement.id}</span> Exception with compensating
                    control
                    {item.reviewOverdue && (
                      <>
                        {' '}
                        · <strong className="warning-text">Review overdue</strong>
                      </>
                    )}
                  </p>
                  <dl className="details-list">
                    <dt>Reason</dt>
                    <dd>{item.answer.reason}</dd>
                    <dt>Compensating control</dt>
                    <dd>{item.answer.compensatingControl}</dd>
                    <dt>Approved by</dt>
                    <dd>{item.answer.approvedBy}</dd>
                    <dt>Review date</dt>
                    <dd>{item.answer.reviewDate}</dd>
                  </dl>
                </li>
              ) : null,
            )}
            {grouped.map(({ group, members }) => (
              <li key={group.id} className="item">
                <p className="item__title">{group.label}</p>
                <p className="item__meta">
                  &quot;Does not apply&quot; for {members.length} requirement
                  {members.length === 1 ? '' : 's'}:{' '}
                  {members.map((m) => m.requirement.id).join(', ')}
                </p>
                <dl className="details-list">
                  <dt>Reason</dt>
                  <dd>{members[0]!.answer.reason}</dd>
                </dl>
              </li>
            ))}
            {single.map((item) => (
              <li key={item.requirement.id} className="item">
                <p className="item__title">{item.requirement.plainText}</p>
                <p className="item__meta">
                  <span className="badge">{item.requirement.id}</span> Does not apply
                </p>
                <dl className="details-list">
                  <dt>Reason</dt>
                  <dd>{item.answer.reason}</dd>
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
