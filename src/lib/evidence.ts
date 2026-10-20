/**
 * The evidence request list and the "Exceptions to review" list.
 * Pass only the requirements in scope for the target level (see inScope in effective.ts).
 */
import type { E8Requirement } from '../data/types.ts';
import { validAnswerFor } from './answers.ts';
import type { Answers, EvidenceRequest, ExceptionItem } from './types.ts';

/** Every requirement answered "Not sure" becomes a request to find evidence. */
export function evidenceRequests(
  requirements: E8Requirement[],
  answers: Answers,
): EvidenceRequest[] {
  return requirements
    .filter((r) => validAnswerFor(r, answers)?.value === 'not-sure')
    .map((requirement) => ({ requirement }));
}

/**
 * Every valid "Does not apply" and exception answer. Both count as met, so they are listed
 * for review: ASD expects exceptions to be minimised, documented, approved and regularly reviewed.
 *
 * @param today ISO date (YYYY-MM-DD) used to flag exceptions whose review date has passed.
 * @param fromGroup requirement ID → product group ID, for answers that came from a group.
 */
export function exceptionsToReview(
  requirements: E8Requirement[],
  answers: Answers,
  today: string,
  fromGroup: Record<string, string> = {},
): ExceptionItem[] {
  const items: ExceptionItem[] = [];
  for (const requirement of requirements) {
    const answer = validAnswerFor(requirement, answers);
    const groupId = fromGroup[requirement.id] ?? null;
    if (answer?.value === 'not-applicable') {
      items.push({ requirement, answer, reviewOverdue: false, groupId });
    } else if (answer?.value === 'exception') {
      // ISO dates compare correctly as strings.
      items.push({ requirement, answer, reviewOverdue: answer.reviewDate < today, groupId });
    }
  }
  return items;
}
