/**
 * Types for assessment answers, context and results.
 * Everything here is plain data, so it can be saved, exported and tested easily.
 */
import type { Domain, E8Requirement, MaturityLevel, Strategy } from '../data/types.ts';

// ---------------------------------------------------------------- Answers

/** The six answer options for an E8 requirement. */
export type AnswerValue = 'yes' | 'partly' | 'no' | 'not-sure' | 'not-applicable' | 'exception';

export type Answer =
  | { value: 'yes' | 'partly' | 'no' | 'not-sure' }
  /** Only on requirements with naAllowed: true. The reason is required. */
  | { value: 'not-applicable'; reason: string }
  /** Available on every requirement. All four fields are required (maturity model exception guidance). */
  | {
      value: 'exception';
      reason: string;
      compensatingControl: string;
      approvedBy: string;
      /** ISO date (YYYY-MM-DD) when the exception is next reviewed. */
      reviewDate: string;
    };

/** Answers keyed by requirement ID. A shared control has one answer, used by every strategy it belongs to. */
export type Answers = Record<string, Answer>;

// ---------------------------------------------------------------- Context questions

export type E8ReportingRequired = 'yes' | 'no' | 'not-sure';
export type SystemsLocation = 'own-hybrid-iaas' | 'saas-paas' | 'not-sure';

export interface AssessmentContext {
  /** Optional, shown only on the report. */
  organisationName: string;
  /** "Are you still required to report Essential Eight maturity?" Changes how the action list is framed. */
  e8ReportingRequired: E8ReportingRequired;
  /** "Where do your systems mainly run?" SaaS and PaaS shows the cloud chapter notice. */
  systemsLocation: SystemsLocation;
  /** The maturity level aimed for. Only requirements up to this level are asked (methodology D29). */
  targetLevel: MaturityLevel;
}

// ---------------------------------------------------------------- E8 scoring results

export interface StrategyResult {
  strategy: Strategy;
  /**
   * 'complete' once every required question has a valid answer (methodology D30).
   * Questions that are not needed for the current level never make a strategy incomplete.
   */
  status: 'complete' | 'incomplete';
  /** Maturity level 0 to 3, never above the target. Null when incomplete. */
  level: 0 | MaturityLevel | null;
  target: MaturityLevel;
  /** Questions that must be answered (and met) for the level to be known. */
  requiredIds: string[];
  /** Required questions with no valid answer yet. */
  requiredRemainingIds: string[];
  /** In-scope questions with no answer that are not needed for the current level. */
  notNeededIds: string[];
  /** Answered requirements that are not met, grouped by their lowest level. */
  unmetIdsByLevel: Record<MaturityLevel, string[]>;
  /**
   * When a requirement is not met, the highest level the strategy could still reach.
   * An upper bound shown for incomplete strategies, never a claimed level. Null if nothing failed.
   */
  cannotExceed: 0 | MaturityLevel | null;
  /** True when the level was reached only through "Does not apply" answers (methodology D31). */
  metOnlyThroughNotApplicable: boolean;
}

export interface E8Result {
  strategies: StrategyResult[];
  target: MaturityLevel;
  /** Lowest strategy level. Null unless every strategy is complete. Not an official "overall maturity". */
  headlineLevel: 0 | MaturityLevel | null;
  /**
   * When some strategies are incomplete: the lowest level among the complete ones, clearly
   * labelled as based on incomplete answers. Null when all are complete or none are.
   */
  provisional: { lowestCompleteLevel: 0 | MaturityLevel; completeCount: number } | null;
}

// ---------------------------------------------------------------- Evidence requests and exceptions

export interface EvidenceRequest {
  requirement: E8Requirement;
}

export interface ExceptionItem {
  requirement: E8Requirement;
  answer: Extract<Answer, { value: 'not-applicable' | 'exception' }>;
  /** True when an exception's review date is before today. Does not change scoring. */
  reviewOverdue: boolean;
  /** The product group that gave this answer, if it came from a group (methodology D31). */
  groupId: string | null;
}

// ---------------------------------------------------------------- Prioritised action list

export interface RelatedPrinciple {
  id: string;
  title: string;
}

export interface ActionItem {
  requirement: E8Requirement;
  answer: AnswerValue;
  /** The lowest maturity level the requirement belongs to. */
  level: MaturityLevel;
  /** True if a linked Essentials action applies in a priority phase 1 technical domain. */
  linkedToPhase1: boolean;
  relatedPrinciples: RelatedPrinciple[];
  nextStep: string;
}

export interface ActionList {
  framing: 'lift-e8-maturity' | 'risk-reduction';
  title: string;
  /** ASD's advice about superseded targets. Shown only for 'risk-reduction'. */
  advice: string | null;
  items: ActionItem[];
  /** Unanswered questions not needed for the current level, so the list may not show all work. */
  notNeededCount: number;
  /** Required questions the user skipped. */
  skippedCount: number;
}

// ---------------------------------------------------------------- Transition view

/**
 * Indicative status of one mapping row for one strategy, compared with the organisation's level.
 * - 'unknown': the strategy is incomplete, so no comparison is possible.
 * - 'above-target': the strategy reached the organisation's target, and the row needs a higher
 *   level that was not assessed (methodology D33).
 */
export type ContributionStatus =
  'may-contribute' | 'may-partly-contribute' | 'gap' | 'unknown' | 'above-target';

/**
 * Status of one action in one domain:
 * - a ContributionStatus when ASD's transition tables map the action in this domain
 * - 'evidence-to-check' when ASD cites E8 controls for the action but gives no mapping row
 *   anywhere (methodology D10 and its proposed extension)
 * - 'no-e8-mapping' when neither applies
 */
export type ActionDomainStatus = ContributionStatus | 'evidence-to-check' | 'no-e8-mapping';

/**
 * ASD's gap analysis terms, used for the author's roll-up (methodology D25). Indicative only, not ratings.
 * - 'unknown': a contributing strategy is incomplete.
 * - 'evidence-to-check': no mapped actions, but ASD cites E8 controls for some of them.
 * - 'no-e8-mapping': no mapped actions and no E8 controls cited. A statement about the framework,
 *   not about the organisation.
 */
export type GapFinding =
  | 'already-effectively-addressed'
  | 'partially-addressed'
  | 'not-addressed'
  | 'unknown'
  | 'evidence-to-check'
  | 'no-e8-mapping';

export type Caution = 'mfa-phishing-resistant-check';

export interface StrategyContribution {
  strategy: Strategy;
  status: ContributionStatus;
  /** The mapping row that gave this status (the highest row reached, methodology D15). */
  rowId: string;
  contributingLevel: MaturityLevel;
  contribution: 'full' | 'partial';
  strengthenNote: string;
  cautions: Caution[];
  /** Where the row comes from, for example "Table 5, page 13" of Transitioning from the Essential Eight. */
  source: string;
}

export interface ActionDomainResult {
  actionId: string;
  principleId: string;
  domain: Domain;
  /** For mapped actions: the weakest status across contributing strategies (author's rule). */
  status: ActionDomainStatus;
  /** One entry per contributing strategy. Empty unless the action is mapped in this domain. */
  contributions: StrategyContribution[];
  /** For 'evidence-to-check': the cited E8 controls and the organisation's answer, if any. */
  evidenceControls: { id: string; answer: AnswerValue | null }[];
}

export interface PrincipleDomainResult {
  principleId: string;
  title: string;
  domain: Domain;
  /** Author's roll-up rule (methodology D25): the weakest mapped action, capped if any are unmapped. */
  finding: GapFinding;
  /** Applicable actions with a mapping row in this domain. */
  mappedActionCount: number;
  /** All applicable actions of this principle in this domain. */
  applicableActionCount: number;
  actions: ActionDomainResult[];
}

export interface DomainGroup {
  domain: Domain;
  priorityPhase: 'all' | 1 | 2 | 3;
  principles: PrincipleDomainResult[];
}

export interface NotCoveredGroup {
  domain: Domain;
  priorityPhase: 'all' | 1 | 2 | 3;
  principles: { principleId: string; title: string; actionIds: string[] }[];
}

export interface TransitionResult {
  /** Domains in priority order: phase 1 and the capability domains first, then phases 2 and 3. */
  domains: DomainGroup[];
  /** "Not covered by the Essential Eight" (methodology D12), grouped by domain and principle. */
  notCovered: NotCoveredGroup[];
}
