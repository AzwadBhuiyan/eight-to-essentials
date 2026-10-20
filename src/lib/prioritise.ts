/**
 * The prioritised action list: unmet E8 requirements in a sensible order.
 *
 * Order (all author's rules, built on ASD's priorities):
 * 1. Level: Maturity Level One gaps before Two, before Three.
 * 2. Exposure: boundary and identity requirements first, matching ASD's priority phase 1 focus
 *    on boundary and identity services.
 * 3. Effort: quick wins, then moderate, then projects.
 * When the organisation is not required to report Essential Eight maturity, items linked to an
 * Essentials action in a priority phase 1 technical domain come first, before the three keys above.
 */
import type { FrameworkData } from '../data/index.ts';
import type { E8Requirement, Effort, Exposure } from '../data/types.ts';
import { isMet, validAnswerFor } from './answers.ts';
import { lowestLevel } from './scoring.ts';
import { ACTION_LIST_TITLE, SUPERSEDED_TARGET_ADVICE } from './text.ts';
import type {
  ActionItem,
  ActionList,
  Answer,
  Answers,
  AssessmentContext,
  RelatedPrinciple,
} from './types.ts';

const EXPOSURE_RANK: Record<Exposure, number> = { boundary: 0, identity: 0, other: 1 };
const EFFORT_RANK: Record<Effort, number> = { 'quick-win': 0, moderate: 1, project: 2 };

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/** A short, generic next step based on the answer. The evidence examples come from the data. */
export function nextStep(requirement: E8Requirement, answer: Answer): string {
  const example = requirement.evidence[0] ? lowerFirst(requirement.evidence[0]) : 'records';
  switch (answer.value) {
    case 'not-sure':
      return `Find out whether this is in place, and collect evidence such as: ${example}.`;
    case 'partly':
      return `Extend this so it is fully in place everywhere it applies, then keep evidence such as: ${example}.`;
    default:
      return `Plan and put this in place, then keep evidence such as: ${example}.`;
  }
}

export function buildActionList(
  data: FrameworkData,
  answers: Answers,
  context: Pick<AssessmentContext, 'e8ReportingRequired'>,
): ActionList {
  const { requirements, structure } = data;
  const actionById = new Map(structure.actions.map((a) => [a.id, a]));
  const titleById = new Map(structure.principles.map((p) => [p.id, p.title]));
  const phase1Domains = new Set(
    structure.domains.filter((d) => d.priorityPhase === 1).map((d) => d.name),
  );

  const items: ActionItem[] = [];
  for (const requirement of requirements) {
    const answer = validAnswerFor(requirement, answers);
    if (!answer || isMet(answer)) continue; // Only answered, unmet requirements are actions.

    const linked = requirement.essentialsActions.flatMap((id) => actionById.get(id) ?? []);
    const principleIds = [...new Set(linked.map((a) => a.principleId))];
    const relatedPrinciples: RelatedPrinciple[] = principleIds.map((id) => ({
      id,
      title: titleById.get(id) ?? id,
    }));

    items.push({
      requirement,
      answer: answer.value,
      level: lowestLevel(requirement),
      linkedToPhase1: linked.some((a) => a.domains.some((d) => phase1Domains.has(d))),
      relatedPrinciples,
      nextStep: nextStep(requirement, answer),
    });
  }

  const framing = context.e8ReportingRequired === 'yes' ? 'lift-e8-maturity' : 'risk-reduction';

  // Array.prototype.sort is stable, so items that tie keep the data file's order.
  items.sort((a, b) => {
    if (framing === 'risk-reduction' && a.linkedToPhase1 !== b.linkedToPhase1) {
      return a.linkedToPhase1 ? -1 : 1;
    }
    return (
      a.level - b.level ||
      EXPOSURE_RANK[a.requirement.exposure] - EXPOSURE_RANK[b.requirement.exposure] ||
      EFFORT_RANK[a.requirement.effort] - EFFORT_RANK[b.requirement.effort]
    );
  });

  return {
    framing,
    title: ACTION_LIST_TITLE[framing],
    advice: framing === 'risk-reduction' ? SUPERSEDED_TARGET_ADVICE : null,
    items,
  };
}
