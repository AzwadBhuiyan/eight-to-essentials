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

/** Labels for the six answer options, used by the wizard and the CSV export. */
export const ANSWER_LABELS = {
  yes: 'Yes, and we can show evidence',
  partly: 'Partly',
  no: 'No',
  'not-sure': 'Not sure',
  'not-applicable': 'Does not apply',
  exception: 'Exception with compensating control',
} as const;

export const LEVEL_NAMES = {
  0: 'Maturity Level Zero',
  1: 'Maturity Level One',
  2: 'Maturity Level Two',
  3: 'Maturity Level Three',
} as const;

/** ASD Essentials publication date, cited from the ASD news release of 15 October 2026 (methodology D16). */
export const LAUNCH_NOTICE =
  'ASD published ASD Essentials on 15 October 2026. Many organisations still need to show Essential Eight progress while planning the move.';

/**
 * Hint under the target level question (methodology D29). Transitioning from the Essential Eight,
 * page 9: Maturity Level Two was the required baseline for Commonwealth entities.
 */
export const TARGET_HINT = 'Government entities and many contracts ask for Maturity Level Two.';

export const TARGET_HINT_SOURCE = {
  text: 'Transitioning from the Essential Eight, page 9',
  url: 'https://www.cyber.gov.au/publication/transitioning-from-the-essential-eight',
};

/** Methodology D30. */
export const NOT_NEEDED_NOTE =
  'Not needed for your current level: a requirement at this level or below is not met in this strategy, so this one cannot change the result. Answering it still helps your action list.';

/** Methodology D31. */
export const MET_ONLY_THROUGH_NA_LABEL = "all requirements marked 'Does not apply'";

/** Methodology D33. */
export const ABOVE_TARGET_LABEL = 'Not assessed (above your target)';

/** Methodology D32: the headline when some strategies are still incomplete. */
export function provisionalHeadline(
  completeCount: number,
  total: number,
  lowestCompleteLevel: 0 | 1 | 2 | 3,
): string {
  return `Not final: ${completeCount} of ${total} strategies complete. Based on incomplete answers, the lowest completed strategy is ${LEVEL_NAMES[lowestCompleteLevel]}.`;
}

/** Methodology D32: an upper bound for an incomplete strategy, never a claimed level. */
export function cannotExceedText(level: 0 | 1 | 2 | 3): string {
  return `Cannot be higher than ${LEVEL_NAMES[level]} so far (a ${LEVEL_NAMES[(level + 1) as 1 | 2 | 3]} requirement is not met).`;
}

/** Methodology D30 and D32: shown above the action list when some questions were not answered. */
export function actionListCoverageNote(notNeeded: number, skipped: number): string | null {
  const parts: string[] = [];
  if (notNeeded > 0)
    parts.push(
      `${notNeeded} question${notNeeded === 1 ? ' was' : 's were'} not needed for your current level`,
    );
  if (skipped > 0) parts.push(`${skipped} question${skipped === 1 ? ' was' : 's were'} skipped`);
  if (parts.length === 0) return null;
  return `${parts.join(' and ')}, so this list may not show all the work for the next level.`;
}
