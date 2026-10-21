import { essentialsStructure } from '../data/index.ts';
import { mappedActionsNote, ROLLUP_RULE_NOTE, TRANSITION_BANNER } from '../lib/text.ts';
import { findingLabel, PRIORITY_PHASE_HEADINGS } from '../lib/transitionText.ts';
import type { TransitionResult } from '../lib/types.ts';

const actionSummary = new Map(essentialsStructure.actions.map((a) => [a.id, a.summary]));

/**
 * A compact ASD Essentials summary for the printed report: each domain's principles with their
 * indicative finding, and the actions not covered by the Essential Eight. The same wording
 * functions as the transition page are used, so the two never disagree.
 */
export function TransitionSummary({ transition }: { transition: TransitionResult }) {
  return (
    <>
      <p className="notice">
        <strong>{TRANSITION_BANNER}</strong>
      </p>
      <p className="muted">{ROLLUP_RULE_NOTE}</p>
      {transition.domains.map((d) => (
        <table key={d.domain} className="report-table">
          <caption>
            ASD Essentials domain: {d.domain} ({PRIORITY_PHASE_HEADINGS[d.priorityPhase]})
          </caption>
          <thead>
            <tr>
              <th scope="col">ASD Essentials principle</th>
              <th scope="col">Indicative finding</th>
            </tr>
          </thead>
          <tbody>
            {d.principles.map((p) => {
              const note = mappedActionsNote(p.mappedActionCount, p.applicableActionCount);
              return (
                <tr key={p.principleId}>
                  <th scope="row">
                    {p.principleId} {p.title}
                  </th>
                  <td>
                    {findingLabel(p.finding)}
                    {note && <span className="muted"> ({note})</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ))}
      <h3>ASD Essentials actions not covered by the Essential Eight</h3>
      <p>These actions have no Essential Eight equivalent, so they need new work.</p>
      <ul>
        {[
          ...new Set(
            transition.notCovered.flatMap((g) => g.principles.flatMap((p) => p.actionIds)),
          ),
        ].map((id) => (
          <li key={id}>
            {id}: {actionSummary.get(id)}
          </li>
        ))}
      </ul>
    </>
  );
}
