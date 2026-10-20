/**
 * Results derived from the current assessment, shared by the wizard and results pages so they
 * always agree: effective answers (including product groups), scoring against the target, and
 * which questions are still needed.
 */
import { useMemo } from 'react';
import { e8Requirements } from '../data/index.ts';
import { effectiveAnswers, inScope } from '../lib/effective.ts';
import { scoreAll } from '../lib/scoring.ts';
import { validAnswerFor } from '../lib/answers.ts';
import type { AssessmentState } from '../lib/assessment.ts';

export function useDerived(state: AssessmentState) {
  return useMemo(() => {
    const target = state.context.targetLevel;
    const effective = effectiveAnswers(state, e8Requirements);
    const asked = inScope(e8Requirements, target);
    const e8 = scoreAll(e8Requirements, effective.answers, target);
    // A shared question is needed if any strategy requires it.
    const requiredAnywhere = new Set(e8.strategies.flatMap((s) => s.requiredIds));
    const answeredIds = new Set(
      asked.filter((r) => validAnswerFor(r, effective.answers)).map((r) => r.id),
    );
    const notNeededIds = new Set(
      asked.filter((r) => !answeredIds.has(r.id) && !requiredAnywhere.has(r.id)).map((r) => r.id),
    );
    const requiredLeft = asked.filter(
      (r) => requiredAnywhere.has(r.id) && !answeredIds.has(r.id),
    ).length;
    return { target, effective, asked, e8, answeredIds, notNeededIds, requiredLeft };
  }, [state]);
}
