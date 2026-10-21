/**
 * Indicative transition view: how an organisation's E8 results relate to ASD Essentials actions.
 *
 * Built on ASD's own mapping tables in Transitioning from the Essential Eight (Tables 3 to 9).
 * It never converts E8 levels into Essentials effectiveness ratings. Each mapping row says
 * which E8 maturity level contributes to an action in a domain, and whether fully or partially.
 * Comparing that with the organisation's level for the strategy gives one of:
 * - may-contribute: level reached and ASD marks the contribution as full
 * - may-partly-contribute: level reached but ASD marks the contribution as partial
 * - gap: the strategy is below the listed level
 * - unknown: the strategy is incomplete, so there is nothing to compare
 */
import type { FrameworkData } from '../data/framework.ts';
import { validAnswerFor } from './answers.ts';
import type { ActionMapping, Domain, MaturityLevel, Strategy } from '../data/types.ts';
import type {
  ActionDomainResult,
  ActionDomainStatus,
  Answers,
  Caution,
  ContributionStatus,
  DomainGroup,
  E8Result,
  GapFinding,
  NotCoveredGroup,
  PrincipleDomainResult,
  StrategyContribution,
  TransitionResult,
} from './types.ts';

// Higher is better. Used to pick the best row within a strategy and the weakest across strategies.
const STATUS_RANK: Record<ContributionStatus, number> = {
  gap: 0,
  unknown: 1,
  'above-target': 1, // not assessed, like unknown: neither a gap nor a contribution
  'may-partly-contribute': 2,
  'may-contribute': 3,
};
type RankedFinding = Exclude<GapFinding, 'evidence-to-check' | 'no-e8-mapping'>;
const FINDING_RANK: Record<RankedFinding, number> = {
  'not-addressed': 0,
  unknown: 1,
  'partially-addressed': 2,
  'already-effectively-addressed': 3,
};

/**
 * Compares one mapping row with the organisation's level for one strategy.
 * Levels are never above the target. If the strategy reached the target and the row needs a
 * higher level, that level was not assessed, so the row is 'above-target', not a gap
 * (methodology D33). If the strategy is below the target, a failed requirement capped it, so it
 * cannot reach the row's level: that is a gap.
 */
export function rowStatus(
  row: Pick<ActionMapping, 'contributingLevel' | 'contribution'>,
  level: 0 | MaturityLevel | null,
  target: MaturityLevel = 3,
): ContributionStatus {
  if (level === null) return 'unknown';
  if (level < row.contributingLevel) return level >= target ? 'above-target' : 'gap';
  // A partial row stays partial however high the level is (methodology D20).
  return row.contribution === 'full' ? 'may-contribute' : 'may-partly-contribute';
}

/** Methodology D14: Table 5 lists Maturity Level One as contributing in full to phishing-resistant MFA. */
function cautionsFor(row: ActionMapping): Caution[] {
  return row.source.location.startsWith('Table 5') && row.contributingLevel === 1
    ? ['mfa-phishing-resistant-check']
    : [];
}

/**
 * For one strategy, picks the row to show from the rows mapping the same action and domain
 * (methodology D15: Table 7 has two rows for one action and domain).
 * The best status wins. Among gaps, the lowest contributing level wins, because that is
 * the next level to reach. Otherwise the highest contributing level reached wins.
 */
function bestRowForStrategy(
  rows: ActionMapping[],
  level: 0 | MaturityLevel | null,
  target: MaturityLevel,
): { row: ActionMapping; status: ContributionStatus } {
  let best: { row: ActionMapping; status: ContributionStatus } | undefined;
  for (const row of rows) {
    const status = rowStatus(row, level, target);
    if (!best) {
      best = { row, status };
      continue;
    }
    const diff = STATUS_RANK[status] - STATUS_RANK[best.status];
    const tieBreak =
      status === 'gap' || status === 'above-target'
        ? row.contributingLevel < best.row.contributingLevel
        : row.contributingLevel > best.row.contributingLevel;
    if (diff > 0 || (diff === 0 && tieBreak)) best = { row, status };
  }
  return best!;
}

const FINDING_FOR: Record<ContributionStatus, RankedFinding> = {
  'may-contribute': 'already-effectively-addressed',
  'may-partly-contribute': 'partially-addressed',
  gap: 'not-addressed',
  unknown: 'unknown',
  'above-target': 'unknown',
};

/** True when ASD's transition tables map the action in this domain (it has a status from a row). */
export function isMapped(status: ActionDomainStatus): status is ContributionStatus {
  return status in STATUS_RANK;
}

/**
 * Author's roll-up rule (methodology D25): how a principle's actions in one domain become one finding.
 *
 * - The weakest MAPPED action sets the finding. Unmapped actions ('no-e8-mapping' and
 *   'evidence-to-check') are not counted as "not addressed": that would be a statement about the
 *   organisation, while "no E8 mapping" is only a statement about the framework.
 * - If any applicable action is unmapped, the finding is capped at "partially addressed", so a
 *   principle can never read as fully addressed when part of it has no E8 mapping.
 * - With no mapped actions there is nothing to roll up: "evidence to check" if ASD cites E8
 *   controls for any of the actions, otherwise "no E8 mapping".
 */
export function rollUp(statuses: ActionDomainStatus[]): GapFinding {
  const mapped = statuses.filter(isMapped);
  if (mapped.length === 0) {
    return statuses.includes('evidence-to-check') ? 'evidence-to-check' : 'no-e8-mapping';
  }
  const weakest = mapped
    .map((s) => FINDING_FOR[s])
    .reduce((a, b) => (FINDING_RANK[b] < FINDING_RANK[a] ? b : a));
  const hasUnmapped = mapped.length < statuses.length;
  if (hasUnmapped && weakest === 'already-effectively-addressed') return 'partially-addressed';
  return weakest;
}

/** Phase 1 first, then the capability domains (all phases), then phases 2 and 3. */
const PHASE_ORDER: Record<'all' | 1 | 2 | 3, number> = { 1: 0, all: 1, 2: 2, 3: 3 };

export function buildTransition(
  data: FrameworkData,
  e8: E8Result,
  answers: Answers,
): TransitionResult {
  const { requirements, structure, map } = data;
  const requirementById = new Map(requirements.map((r) => [r.id, r]));
  const levelOf = new Map<Strategy, 0 | MaturityLevel | null>(
    e8.strategies.map((s) => [s.strategy, s.level]),
  );
  const titleById = new Map(structure.principles.map((p) => [p.id, p.title]));

  // Excluded rows are kept in the data for traceability only (methodology D11).
  const rows = map.mappings.filter((m) => !m.excluded);
  const mappedActions = new Set(rows.map((r) => r.actionId));
  const rowsByActionDomain = new Map<string, ActionMapping[]>();
  for (const row of rows) {
    const key = `${row.actionId}|${row.domain}`;
    rowsByActionDomain.set(key, [...(rowsByActionDomain.get(key) ?? []), row]);
  }

  function actionResult(actionId: string, domain: Domain): ActionDomainResult {
    const action = structure.actions.find((a) => a.id === actionId)!;
    const base = { actionId, principleId: action.principleId, domain };
    const domainRows = rowsByActionDomain.get(`${actionId}|${domain}`) ?? [];

    if (domainRows.length > 0) {
      // Each strategy contributes separately. Table 4 rows list both patching strategies,
      // so each is checked on its own and the weaker result wins (methodology D9).
      const strategies = [...new Set(domainRows.flatMap((r) => r.strategies))];
      const contributions: StrategyContribution[] = strategies.map((strategy) => {
        const { row, status } = bestRowForStrategy(
          domainRows.filter((r) => r.strategies.includes(strategy)),
          levelOf.get(strategy) ?? null,
          e8.target,
        );
        return {
          strategy,
          status,
          rowId: row.id,
          contributingLevel: row.contributingLevel,
          contribution: row.contribution,
          strengthenNote: row.strengthenNote,
          cautions: cautionsFor(row),
          source: row.source.location,
        };
      });
      // Author's rule: across strategies, the weakest status sets the action's status.
      const status = contributions.reduce((a, b) =>
        STATUS_RANK[b.status] < STATUS_RANK[a.status] ? b : a,
      ).status;
      return { ...base, status, contributions, evidenceControls: [] };
    }

    // No mapping row in this domain. If ASD cites E8 controls for the action but gives no mapping
    // row anywhere, show them as evidence to check, with no status (methodology D10).
    if (!mappedActions.has(actionId) && action.e8Controls.length > 0) {
      return {
        ...base,
        status: 'evidence-to-check',
        contributions: [],
        // Only valid answers are reported; an invalid answer counts as unanswered everywhere.
        evidenceControls: action.e8Controls.map((id) => {
          const requirement = requirementById.get(id);
          const answer = requirement ? validAnswerFor(requirement, answers) : undefined;
          return { id, answer: answer?.value ?? null };
        }),
      };
    }
    return { ...base, status: 'no-e8-mapping', contributions: [], evidenceControls: [] };
  }

  const domainsInOrder = [...structure.domains].sort(
    (a, b) => PHASE_ORDER[a.priorityPhase] - PHASE_ORDER[b.priorityPhase],
  );

  const domains: DomainGroup[] = domainsInOrder.map((d) => {
    const principles: PrincipleDomainResult[] = structure.principles
      .filter((p) => p.domains.includes(d.name))
      .map((p) => {
        const actions = structure.actions
          .filter((a) => a.principleId === p.id && a.domains.includes(d.name))
          .map((a) => actionResult(a.id, d.name));
        return {
          principleId: p.id,
          title: p.title,
          domain: d.name,
          finding: rollUp(actions.map((a) => a.status)),
          mappedActionCount: actions.filter((a) => isMapped(a.status)).length,
          applicableActionCount: actions.length,
          actions,
        };
      });
    return { domain: d.name, priorityPhase: d.priorityPhase, principles };
  });

  // "Not covered by the Essential Eight" (methodology D12), grouped by domain and principle.
  const notCovered: NotCoveredGroup[] = domainsInOrder
    .map((d) => {
      const actions = structure.actions.filter(
        (a) => !a.hasE8Equivalent && a.domains.includes(d.name),
      );
      const principleIds = [...new Set(actions.map((a) => a.principleId))];
      return {
        domain: d.name,
        priorityPhase: d.priorityPhase,
        principles: principleIds.map((id) => ({
          principleId: id,
          title: titleById.get(id) ?? id,
          actionIds: actions.filter((a) => a.principleId === id).map((a) => a.id),
        })),
      };
    })
    .filter((g) => g.principles.length > 0);

  return { domains, notCovered };
}
