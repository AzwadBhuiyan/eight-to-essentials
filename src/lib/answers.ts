/**
 * Rules for individual answers: which answers are valid, and which count as "met".
 */
import type { E8Requirement } from '../data/types.ts';
import type { Answer, Answers } from './types.ts';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  // Rejects dates like 2026-02-30, which JavaScript would silently roll over.
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const blank = (value: string) => value.trim() === '';

/**
 * Returns the problems with an answer, or an empty list if it is valid.
 * - "Does not apply" needs a written reason, and is only allowed where the data says naAllowed.
 * - An exception needs a reason, a compensating control, an approver and a real review date,
 *   matching the maturity model's guidance that exceptions are documented, approved,
 *   supported by compensating controls and regularly reviewed.
 */
export function answerProblems(requirement: E8Requirement, answer: Answer): string[] {
  const problems: string[] = [];
  if (answer.value === 'not-applicable') {
    if (!requirement.naAllowed)
      problems.push('"Does not apply" is not available for this requirement.');
    if (blank(answer.reason)) problems.push('Give a reason why this does not apply.');
  }
  if (answer.value === 'exception') {
    if (blank(answer.reason)) problems.push('Give the reason for the exception.');
    if (blank(answer.compensatingControl)) problems.push('Describe the compensating control.');
    if (blank(answer.approvedBy)) problems.push('Say who approved the exception.');
    if (!isRealDate(answer.reviewDate)) problems.push('Give a review date (YYYY-MM-DD).');
  }
  return problems;
}

export function isValidAnswer(requirement: E8Requirement, answer: Answer): boolean {
  return answerProblems(requirement, answer).length === 0;
}

/**
 * Returns the requirement's answer only if it is valid.
 * An invalid answer is treated as unanswered, so it can never produce a maturity level.
 */
export function validAnswerFor(requirement: E8Requirement, answers: Answers): Answer | undefined {
  const answer = answers[requirement.id];
  return answer && isValidAnswer(requirement, answer) ? answer : undefined;
}

/**
 * Whether an answer counts as met.
 * "Yes" is met. A valid "Does not apply" or exception also counts as met, but both are listed
 * under "Exceptions to review". "Partly", "No" and "Not sure" are never met.
 */
export function isMet(answer: Answer): boolean {
  return (
    answer.value === 'yes' || answer.value === 'not-applicable' || answer.value === 'exception'
  );
}
