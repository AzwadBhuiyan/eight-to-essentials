/**
 * The evidence request list and the "Exceptions to review" list.
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
 */
export function exceptionsToReview(
  requirements: E8Requirement[],
  answers: Answers,
  today: string,
): ExceptionItem[] {
  const items: ExceptionItem[] = [];
  for (const requirement of requirements) {
    const answer = validAnswerFor(requirement, answers);
    if (answer?.value === 'not-applicable') {
      items.push({ requirement, answer, reviewOverdue: false });
    } else if (answer?.value === 'exception') {
      // ISO dates compare correctly as strings.
      items.push({ requirement, answer, reviewOverdue: answer.reviewDate < today });
    }
  }
  return items;
}
