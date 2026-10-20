/**
 * Fixed wording used by the results, action list and transition view.
 * Kept here, next to the logic that decides when it is shown, so tests can check it.
 */

export const DISCLAIMER =
  'Self-assessment. Not an official ASD assessment, audit or certification. Not legal, compliance or insurance advice.';

export const HEADLINE_EXPLANATION =
  'ASD recommends reaching each maturity level across all eight strategies before moving to the next, so your weakest strategy sets your headline.';

export const ACTION_LIST_TITLE = {
  'lift-e8-maturity': 'Actions to lift your Essential Eight maturity',
  'risk-reduction': 'Risk-reduction actions',
} as const;

/** Paraphrase of ASD's advice in Transitioning from the Essential Eight (page 22). */
export const SUPERSEDED_TARGET_ADVICE =
  'ASD advises against starting work only to reach a superseded Essential Eight target, unless a regulator or other obligation still requires it, or it still addresses material cyber security risk. Prefer work that also supports the related ASD Essentials principles.';

export const TRANSITION_BANNER =
  'Indicative only. ASD says Essential Eight ratings do not automatically convert into ASD Essentials effectiveness ratings, and even Maturity Level Three does not automatically produce fully effective ratings.';

export const MAY_CONTRIBUTE_MESSAGE =
  'Your E8 evidence may be reusable here. Check it is current, shows the action is effective (not just deployed) and covers this domain.';

/** Methodology D14. */
export const MFA_PHISHING_RESISTANT_CAUTION =
  'The Essential Eight only requires phishing-resistant MFA from Maturity Level Two. Check that your evidence shows phishing-resistant MFA.';

/** Methodology D16. */
export const CLOUD_CHAPTER_NOTICE =
  'ASD suggests organisations that run predominantly on SaaS and PaaS start with the ASD Essentials for cloud chapter. This version of Eight to Essentials covers the enterprise IT chapter only.';

export const ROLLUP_RULE_NOTE =
  'The roll-up to principles is our own rule, not ASD’s: the weakest mapped action sets each principle’s finding, and a principle with any unmapped action can be at most partially addressed.';

/**
 * Methodology D25: shown when some of a principle's actions have no E8 mapping in a domain.
 * Returns null when every action is mapped.
 */
export function mappedActionsNote(mapped: number, applicable: number): string | null {
  if (mapped === applicable) return null;
  return `${mapped} of ${applicable} actions mapped; assess the rest separately.`;
}
