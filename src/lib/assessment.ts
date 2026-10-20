/**
 * The saved shape of an assessment, and the reducer that changes it.
 * Pure functions, so the React state, local storage and import/export all share one model.
 */
import type { Answer, Answers, AssessmentContext } from './types.ts';

export interface AssessmentState {
  context: AssessmentContext;
  answers: Answers;
}

export const EMPTY_CONTEXT: AssessmentContext = {
  organisationName: '',
  e8ReportingRequired: 'not-sure',
  systemsLocation: 'not-sure',
};

export const EMPTY_STATE: AssessmentState = { context: EMPTY_CONTEXT, answers: {} };

export type AssessmentAction =
  | { type: 'set-context'; context: AssessmentContext }
  | { type: 'set-answer'; id: string; answer: Answer }
  | { type: 'clear-answer'; id: string }
  | { type: 'replace'; state: AssessmentState }
  | { type: 'reset' };

export function assessmentReducer(
  state: AssessmentState,
  action: AssessmentAction,
): AssessmentState {
  switch (action.type) {
    case 'set-context':
      return { ...state, context: action.context };
    case 'set-answer':
      return { ...state, answers: { ...state.answers, [action.id]: action.answer } };
    case 'clear-answer': {
      const answers = { ...state.answers };
      delete answers[action.id];
      return { ...state, answers };
    }
    case 'replace':
      return action.state;
    case 'reset':
      return EMPTY_STATE;
  }
}
