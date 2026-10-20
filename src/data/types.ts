/**
 * Types for the framework data files in this folder.
 * The JSON files are the source of truth; these types describe their shape.
 */

/** ASD's names for the eight mitigation strategies, in ASD's order. */
export const STRATEGIES = [
  'Patch applications',
  'Patch operating systems',
  'Multi-factor authentication',
  'Restrict administrative privileges',
  'Application control',
  'Restrict Microsoft Office macros',
  'User application hardening',
  'Regular backups',
] as const;

export type Strategy = (typeof STRATEGIES)[number];

/** Maturity levels a requirement can belong to. Level 0 has no requirements. */
export type MaturityLevel = 1 | 2 | 3;

/** Author's own estimate of the work needed. Not from ASD. */
export type Effort = 'quick-win' | 'moderate' | 'project';

/**
 * Author's own heuristic, used to sort the action list:
 * - identity: MFA, privileged access and credentials
 * - boundary: internet-facing servers, network devices and online services
 * - other: everything else
 */
export type Exposure = 'boundary' | 'identity' | 'other';

/** 'ism' = official ISM control ID. 'local' = this project's ID (E8MM-2023-NN) where none was available. */
export type IdSource = 'ism' | 'local';

/** ASD Essentials for enterprise IT domains, in ASD's order. */
export const DOMAINS = [
  'Governance and culture',
  'Visibility and response',
  'Boundary services',
  'Identity services',
  'Critical processes and services',
  'Privileged environments',
  'Business systems',
  'User devices',
] as const;

export type Domain = (typeof DOMAINS)[number];

/** Priority phase. Capability domains apply in all phases. A sequencing aid, not a rating. */
export type PriorityPhase = 'all' | 1 | 2 | 3;

export interface SourceRef {
  document: string;
  url: string;
  location: string;
}

export interface E8Requirement {
  id: string;
  idSource: IdSource;
  /** Usually one strategy. Shared controls (for example, event logging) list several. */
  strategies: Strategy[];
  /** Every level the requirement applies at. Asked once, counted at each level listed. */
  levels: MaturityLevel[];
  plainText: string;
  /** Short bullets when a requirement has several conditions. All must be true. */
  conditions: string[];
  /** Optional one-line clarification shown under the question. Null when not needed. */
  helpText: string | null;
  whyItMatters: string;
  evidence: string[];
  effort: Effort;
  exposure: Exposure;
  /** True only where the requirement names a product or service an organisation may not use. */
  naAllowed: boolean;
  /** Explains when "Does not apply" is appropriate. Null when naAllowed is false. */
  naGuidance: string | null;
  /** ASD Essentials action IDs that cite this control as potential evidence. */
  essentialsActions: string[];
  source: {
    document: string;
    url: string;
    /** One entry per level: appendix and page number in the maturity model. */
    locations: string[];
    /** Where the ISM ID was taken from. Null for local IDs. */
    ismId: SourceRef | null;
    /** Where the Essentials action links were taken from. Null if none. */
    essentialsActions: SourceRef | null;
  };
}

// ---------------------------------------------------------------- essentials-structure.json

export interface EssentialsDomain {
  name: Domain;
  kind: 'capability' | 'technical';
  priorityPhase: PriorityPhase;
  description: string;
  /** Number of principles with at least one action in this domain (from the Assessment Workbook). */
  applicablePrincipleCount: number;
  applicableActionCount: number;
  source: SourceRef;
}

export interface EssentialsPrinciple {
  /** ISM principle identifier, for example PRO-13. */
  id: string;
  /** ASD's short principle title. */
  title: string;
  domains: Domain[];
  source: SourceRef;
}

export interface EssentialsAction {
  /** Action ID, for example IT.PRO-13.4. */
  id: string;
  principleId: string;
  /** Plain-English paraphrase of the action. */
  summary: string;
  domains: Domain[];
  /** E8 requirement IDs the evidence guide cites as potential evidence for this action. */
  e8Controls: string[];
  /** IDs the evidence guide cites that have no matching E8 requirement (wording not published in our sources). */
  unmatchedE8References: string[];
  /** False only for actions listed as "Not covered by the Essential Eight" (methodology D12). */
  hasE8Equivalent: boolean;
  source: { action: SourceRef; applicability: SourceRef; e8References: SourceRef };
}

export interface EssentialsStructure {
  domains: EssentialsDomain[];
  principles: EssentialsPrinciple[];
  actions: EssentialsAction[];
}

// ---------------------------------------------------------------- e8-to-essentials-map.json

export interface StrategyPrinciples {
  strategy: Strategy;
  /** Principles listed for the strategy in Table 2 of Transitioning from the Essential Eight. */
  table2Principles: string[];
  /** Principles named in the strategy's own section (differs from Table 2 for User application hardening). */
  sectionPrinciples: string[];
  /** Listed principles with no action rows: shown as "ASD lists this principle but gives no action-level mapping". */
  principlesWithoutActionMapping: string[];
  source: SourceRef;
}

export interface ActionMapping {
  /** Row ID: table number and row number, for example T6-03. */
  id: string;
  /** Usually one strategy. Table 4 rows apply to both patching strategies (methodology D9). */
  strategies: Strategy[];
  actionId: string;
  principleId: string;
  domain: Domain;
  /** E8 maturity level ASD lists as contributing. */
  contributingLevel: MaturityLevel;
  contribution: 'full' | 'partial';
  /** Paraphrase of ASD's "Existing E8 contribution" column for this action. */
  strengthenNote: string;
  /** True for rows kept for traceability but not used (methodology D11). */
  excluded: boolean;
  excludedReason: string | null;
  source: SourceRef;
}

export interface StrengthenPoint {
  topic: string;
  text: string;
}

export interface StrengthenGroup {
  strategies: Strategy[];
  points: StrengthenPoint[];
  source: SourceRef;
}

export interface E8ToEssentialsMap {
  strategies: StrategyPrinciples[];
  mappings: ActionMapping[];
  strengthen: StrengthenGroup[];
  eventLoggingDetectionAndResponse: {
    principles: string[];
    strengthen: StrengthenPoint[];
    source: SourceRef;
  };
}

// ---------------------------------------------------------------- meta.json

export interface Meta {
  /** ISO date the data was last checked against the official documents. */
  dataCheckedOn: string;
  frameworks: {
    id: string;
    name: string;
    version: string;
    firstPublished?: string;
    lastUpdated?: string;
    published?: string;
    url: string;
    note: string;
  }[];
  documents: { name: string; url: string }[];
  licence: { name: string; url: string; attribution: string; exclusions: string };
}
