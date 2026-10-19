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
