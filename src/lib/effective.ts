/**
 * Works out the answer that counts for each requirement (methodology D31):
 * 1. the user's own answer, if there is one
 * 2. otherwise "Does not apply" from a ticked product group, with the group's shared reason
 * 3. otherwise no answer (skipped questions also have no answer)
 *
 * A group answer goes through the same rules as any other answer, so a group without a reason
 * does not count, and a group can never answer a requirement that does not allow "Does not apply".
 */
import type { E8Requirement, MaturityLevel } from '../data/types.ts';
import type { AssessmentState } from './assessment.ts';
import { lowestLevel } from './scoring.ts';
import type { Answers } from './types.ts';

export interface EffectiveAnswers {
  answers: Answers;
  /** Requirement ID → product group ID, for answers that came from a group. */
  fromGroup: Record<string, string>;
}

export function effectiveAnswers(
  state: AssessmentState,
  requirements: E8Requirement[],
): EffectiveAnswers {
  const answers: Answers = { ...state.answers };
  const fromGroup: Record<string, string> = {};
  for (const r of requirements) {
    if (answers[r.id] || !r.naAllowed || r.naGroup === null) continue;
    const group = state.productGroups[r.naGroup];
    if (group) {
      answers[r.id] = { value: 'not-applicable', reason: group.reason };
      fromGroup[r.id] = r.naGroup;
    }
  }
  return { answers, fromGroup };
}

/** Requirements asked for a target level: those whose lowest level is at or below it (methodology D29). */
export function inScope(requirements: E8Requirement[], target: MaturityLevel): E8Requirement[] {
  return requirements.filter((r) => lowestLevel(r) <= target);
}
