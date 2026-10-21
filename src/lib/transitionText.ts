/**
 * Wording for the transition view. Everything is indicative: "may", "check" and ASD's gap terms,
 * never "compliant" or a rating.
 */
import type { Domain } from '../data/types.ts';
import { LEVEL_NAMES, ABOVE_TARGET_LABEL } from './text.ts';
import type {
  ActionDomainStatus,
  ContributionStatus,
  GapFinding,
  StrategyContribution,
} from './types.ts';

/**
 * Label for one strategy's contribution to an action in a domain.
 * A partial row is ALWAYS labelled as partial coverage in that domain, whatever ASD's note says
 * (methodology D20), so a note such as "strong evidence" can never make it read as full.
 */
export function contributionLabel(status: ContributionStatus, domain: Domain): string {
  switch (status) {
    case 'may-contribute':
      return 'May contribute';
    case 'may-partly-contribute':
      return `Partial coverage in ${domain}`;
    case 'gap':
      return 'Gap';
    case 'unknown':
      return 'Unknown: strategy incomplete';
    case 'above-target':
      return ABOVE_TARGET_LABEL;
  }
}

/** Label for an action in a domain, combining its strategies (or explaining why there is none). */
export function actionStatusLabel(status: ActionDomainStatus, domain: Domain): string {
  if (status === 'evidence-to-check') return 'E8 evidence to check';
  if (status === 'no-e8-mapping') return 'No E8 mapping: assess separately';
  return contributionLabel(status, domain);
}

/** One sentence explaining a strategy's contribution, shown after the label. */
export function contributionExplanation(c: StrategyContribution, target: 0 | 1 | 2 | 3): string {
  const needs = `${c.strategy} at ${LEVEL_NAMES[c.contributingLevel]}`;
  switch (c.status) {
    case 'may-contribute':
      return `ASD maps ${needs} as contributing in full here.`;
    case 'may-partly-contribute':
      return `ASD maps ${needs} as contributing only in part here, so other work is needed in this domain.`;
    case 'gap':
      return `ASD maps ${needs} here, and your result for ${c.strategy} is below that level.`;
    case 'unknown':
      return `${c.strategy} is incomplete, so this cannot be compared yet.`;
    case 'above-target':
      return `ASD maps ${needs} here, which is above the target you assessed (${LEVEL_NAMES[target]}).`;
  }
}

/**
 * Principle-level findings, using ASD's gap analysis terms (Transitioning from the Essential Eight,
 * page 22) with "may", because they are indicative and built on the author's roll-up rule (D25).
 */
export function findingLabel(finding: GapFinding): string {
  switch (finding) {
    case 'already-effectively-addressed':
      return 'May already be effectively addressed';
    case 'partially-addressed':
      return 'May be partially addressed';
    case 'not-addressed':
      return 'Not addressed by your Essential Eight results';
    case 'unknown':
      return 'Unknown: a contributing strategy is incomplete or not assessed';
    case 'evidence-to-check':
      return 'E8 evidence to check';
    case 'no-e8-mapping':
      return 'No E8 mapping: assess separately';
  }
}

/** Every heading on the transition view names ASD Essentials, so it is never mistaken for E8 results. */
export const PRIORITY_PHASE_HEADINGS = {
  1: 'ASD Essentials priority phase 1',
  all: 'ASD Essentials: all phases (capability domains)',
  2: 'ASD Essentials priority phase 2',
  3: 'ASD Essentials priority phase 3',
} as const;

export const TRANSITION_TITLE = 'ASD Essentials transition view';

export const TRANSITION_VIEW_LABEL =
  'You are looking at ASD Essentials for enterprise IT, not your Essential Eight result. Everything here is indicative and built on ASD’s transition mapping.';

/** Methodology D13. */
export function noActionMappingText(principleTitle: string): string {
  return `ASD lists ${principleTitle} but gives no action-level mapping.`;
}

export const INCOMPLETE_TRANSITION_NOTE =
  'Some strategies are incomplete, so parts of this view are based on incomplete answers and show as unknown.';
