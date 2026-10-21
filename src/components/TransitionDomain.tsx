import type { EssentialsAction, EssentialsDomain } from '../data/types.ts';
import {
  MAY_CONTRIBUTE_MESSAGE,
  MFA_PHISHING_RESISTANT_CAUTION,
  ANSWER_LABELS,
} from '../lib/text.ts';
import { mappedActionsNote } from '../lib/text.ts';
import {
  actionStatusLabel,
  contributionExplanation,
  contributionLabel,
  findingLabel,
} from '../lib/transitionText.ts';
import type {
  ActionDomainResult,
  ContributionStatus,
  DomainGroup,
  GapFinding,
  PrincipleDomainResult,
  StrategyContribution,
} from '../lib/types.ts';

/** CSS tone for a status. Every status also has a text label, so colour is never the only signal. */
function tone(status: ContributionStatus | GapFinding | 'evidence-to-check' | 'no-e8-mapping') {
  switch (status) {
    case 'may-contribute':
    case 'already-effectively-addressed':
      return 'status--positive';
    case 'may-partly-contribute':
    case 'partially-addressed':
      return 'status--partial';
    case 'gap':
    case 'not-addressed':
      return 'status--gap';
    default:
      return 'status--neutral';
  }
}

interface Props {
  group: DomainGroup;
  domain: EssentialsDomain;
  actionsById: Map<string, EssentialsAction>;
  requirementText: Map<string, string>;
  target: 0 | 1 | 2 | 3;
  open: boolean;
}

/** One domain: a collapsible section with each principle's indicative finding and its actions. */
export function TransitionDomain({
  group,
  domain,
  actionsById,
  requirementText,
  target,
  open,
}: Props) {
  const counts = new Map<GapFinding, number>();
  for (const p of group.principles) counts.set(p.finding, (counts.get(p.finding) ?? 0) + 1);

  return (
    <details className="domain" open={open}>
      <summary>
        <span className="domain__name">{group.domain}</span>{' '}
        <span className="muted">({group.principles.length} principles)</span>
      </summary>
      <p className="muted">{domain.description}</p>
      <ul className="finding-counts">
        {[...counts.entries()].map(([finding, count]) => (
          <li key={finding}>
            <span className={`status ${tone(finding)}`}>{findingLabel(finding)}</span>: {count}
          </li>
        ))}
      </ul>
      {group.principles.map((p) => (
        <PrincipleCard
          key={p.principleId}
          principle={p}
          actionsById={actionsById}
          requirementText={requirementText}
          target={target}
        />
      ))}
    </details>
  );
}

function PrincipleCard({
  principle: p,
  actionsById,
  requirementText,
  target,
}: {
  principle: PrincipleDomainResult;
  actionsById: Map<string, EssentialsAction>;
  requirementText: Map<string, string>;
  target: 0 | 1 | 2 | 3;
}) {
  const note = mappedActionsNote(p.mappedActionCount, p.applicableActionCount);
  return (
    <details className="principle">
      <summary>
        <span className="badge">{p.principleId}</span> {p.title}:{' '}
        <span className={`status ${tone(p.finding)}`}>{findingLabel(p.finding)}</span>
        {note && <span className="principle__note"> · {note}</span>}
      </summary>
      <ul className="action-list">
        {p.actions.map((a) => (
          <ActionResult
            key={a.actionId}
            action={a}
            summary={actionsById.get(a.actionId)?.summary ?? a.actionId}
            requirementText={requirementText}
            target={target}
          />
        ))}
      </ul>
    </details>
  );
}

function ActionResult({
  action: a,
  summary,
  requirementText,
  target,
}: {
  action: ActionDomainResult;
  summary: string;
  requirementText: Map<string, string>;
  target: 0 | 1 | 2 | 3;
}) {
  return (
    <li className="action">
      <p className="action__title">
        <span className="badge">{a.actionId}</span> {summary}
      </p>
      <p>
        <span className={`status ${tone(a.status)}`}>{actionStatusLabel(a.status, a.domain)}</span>
      </p>

      {a.contributions.length > 0 && (
        <ul className="contribution-list">
          {a.contributions.map((c) => (
            <Contribution key={c.strategy} c={c} domain={a.domain} target={target} />
          ))}
        </ul>
      )}

      {a.status === 'evidence-to-check' && (
        <>
          <p>
            ASD cites these Essential Eight controls as possible evidence, but gives no mapping for
            this action. Check whether your evidence for them covers this action in this domain.
          </p>
          <ul>
            {a.evidenceControls.map((e) => (
              <li key={e.id}>
                <span className="badge">{e.id}</span> {requirementText.get(e.id) ?? ''} Your answer:{' '}
                {e.answer ? ANSWER_LABELS[e.answer] : 'not answered'}.
              </li>
            ))}
          </ul>
        </>
      )}

      {a.status === 'no-e8-mapping' && (
        <p className="muted">
          ASD&apos;s transition tables give no Essential Eight mapping for this action in this
          domain. This says nothing about your organisation: assess it separately.
        </p>
      )}
    </li>
  );
}

/**
 * One strategy's contribution. The status label always comes first, and a partial row is always
 * labelled "Partial coverage in [domain]" before ASD's note (methodology D20).
 */
function Contribution({
  c,
  domain,
  target,
}: {
  c: StrategyContribution;
  domain: ActionDomainResult['domain'];
  target: 0 | 1 | 2 | 3;
}) {
  return (
    <li className="contribution">
      <p>
        <strong>{c.strategy}:</strong>{' '}
        <span className={`status ${tone(c.status)}`}>{contributionLabel(c.status, domain)}</span>
      </p>
      <p>{contributionExplanation(c, target)}</p>
      {c.status === 'may-contribute' && <p>{MAY_CONTRIBUTE_MESSAGE}</p>}
      <p className="contribution__note">ASD&apos;s note (paraphrased): {c.strengthenNote}</p>
      {c.cautions.includes('mfa-phishing-resistant-check') && (
        <p className="question__help">{MFA_PHISHING_RESISTANT_CAUTION}</p>
      )}
      <p className="muted">Source: Transitioning from the Essential Eight, {c.source}.</p>
    </li>
  );
}
