import { useId } from 'react';
import type { EvidenceRequest } from '../lib/types.ts';

/** Requirements answered "Not sure": what to look for to find out. */
export function EvidenceSection({ requests }: { requests: EvidenceRequest[] }) {
  const id = useId();
  return (
    <section aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>Evidence to find</h2>
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
