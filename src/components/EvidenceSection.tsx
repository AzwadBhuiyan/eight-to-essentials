import { useId } from 'react';
import { FrameworkTag } from './FrameworkTag.tsx';
import type { EvidenceRequest } from '../lib/types.ts';

/** Requirements answered "Not sure": what to look for to find out. */
export function EvidenceSection({
  requests,
  headingLevel = 2,
}: {
  requests: EvidenceRequest[];
  headingLevel?: 2 | 3;
}) {
  const id = useId();
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  return (
    <section aria-labelledby={`${id}-heading`}>
      <FrameworkTag framework="e8" />
      <Heading id={`${id}-heading`}>Essential Eight: evidence to find</Heading>
      {requests.length === 0 ? (
        <p>No evidence requests: you did not answer &quot;Not sure&quot; to any question.</p>
      ) : (
        <>
          <p>
            You answered &quot;Not sure&quot; to these, so they count as not met. Finding this
            evidence would settle them.
          </p>
          <ul className="item-list">
            {requests.map(({ requirement: r }) => (
              <li key={r.id} className="item">
                <p className="item__title">{r.plainText}</p>
                <p className="item__meta">
                  <span className="badge">{r.id}</span> {r.strategies.join(', ')}
                </p>
                <p>
                  <strong>Evidence that would show this:</strong>
                </p>
                <ul>
                  {r.evidence.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
