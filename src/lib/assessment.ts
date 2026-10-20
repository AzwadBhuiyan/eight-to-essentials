/**
 * The saved shape of an assessment, and the reducer that changes it.
 * Pure functions, so the React state, local storage and import/export all share one model.
 */
import type { Answer, Answers, AssessmentContext } from './types.ts';

export interface AssessmentState {
  context: AssessmentContext;
  /** The user's own answers, keyed by requirement ID. They always win over a product group. */
  answers: Answers;
  /** "We don't use X" answers, keyed by product group ID, each with one shared reason. */
  productGroups: Record<string, { reason: string }>;
  /** Questions the user chose to skip for now. A skipped question counts as unanswered. */
  skipped: string[];
}

export const EMPTY_CONTEXT: AssessmentContext = {
  organisationName: '',
  e8ReportingRequired: 'not-sure',
  systemsLocation: 'not-sure',
  targetLevel: 1,
};

export const EMPTY_STATE: AssessmentState = {
  context: EMPTY_CONTEXT,
  answers: {},
  productGroups: {},
  skipped: [],
};

export type AssessmentAction =
  | { type: 'set-context'; context: AssessmentContext }
  | { type: 'set-answer'; id: string; answer: Answer }
  | { type: 'clear-answer'; id: string }
  | { type: 'set-group'; groupId: string; reason: string }
  | { type: 'remove-group'; groupId: string }
  | { type: 'skip'; id: string }
  | { type: 'unskip'; id: string }
  | { type: 'replace'; state: AssessmentState }
  | { type: 'reset' };

const without = (list: string[], id: string) => list.filter((x) => x !== id);

export function assessmentReducer(
  state: AssessmentState,
  action: AssessmentAction,
): AssessmentState {
  switch (action.type) {
    case 'set-context':
      return { ...state, context: action.context };
    case 'set-answer':
      // Answering a question also takes it off the skipped list.
      return {
        ...state,
        answers: { ...state.answers, [action.id]: action.answer },
        skipped: without(state.skipped, action.id),
      };
    case 'clear-answer': {
      const answers = { ...state.answers };
      delete answers[action.id];
      return { ...state, answers };
    }
    case 'set-group':
      return {
        ...state,
        productGroups: { ...state.productGroups, [action.groupId]: { reason: action.reason } },
      };
    case 'remove-group': {
      const productGroups = { ...state.productGroups };
      delete productGroups[action.groupId];
      return { ...state, productGroups };
    }
    case 'skip':
      return state.skipped.includes(action.id)
        ? state
        : { ...state, skipped: [...state.skipped, action.id] };
    case 'unskip':
      return { ...state, skipped: without(state.skipped, action.id) };
    case 'replace':
      return action.state;
    case 'reset':
      return EMPTY_STATE;
  }
}
