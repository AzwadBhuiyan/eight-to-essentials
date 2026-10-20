import { describe, expect, it } from 'vitest';
import { e8Requirements } from '../data/index.ts';
import { answerProblems, isMet, isValidAnswer } from './answers.ts';
import { validException } from './test-helpers.ts';
import type { Answer } from './types.ts';

const byId = (id: string) => e8Requirements.find((r) => r.id === id)!;
const macroRequirement = byId('ISM-1671'); // naAllowed: true (no Microsoft Office)
const appControlRequirement = byId('ISM-0843'); // naAllowed: false

describe('"Does not apply"', () => {
  it('is rejected without a reason', () => {
    expect(isValidAnswer(macroRequirement, { value: 'not-applicable', reason: '   ' })).toBe(false);
  });

  it('is rejected where naAllowed is false, even with a reason', () => {
    const answer: Answer = { value: 'not-applicable', reason: 'We do not think it applies' };
    expect(appControlRequirement.naAllowed).toBe(false);
    expect(answerProblems(appControlRequirement, answer)).toContain(
      '"Does not apply" is not available for this requirement.',
    );
  });

  it('is accepted with a reason where naAllowed is true', () => {
    expect(
      isValidAnswer(macroRequirement, {
        value: 'not-applicable',
        reason: 'We use Google Workspace; Microsoft Office is not installed anywhere',
      }),
    ).toBe(true);
  });
});

describe('Exception with compensating control', () => {
  it('is accepted when every field is filled in', () => {
    expect(isValidAnswer(appControlRequirement, validException)).toBe(true);
  });

  it.each([
    ['reason', { reason: '' }],
    ['compensating control', { compensatingControl: '' }],
    ['approver', { approvedBy: ' ' }],
    ['review date', { reviewDate: '' }],
  ])('is rejected without a %s', (_label, change) => {
    expect(isValidAnswer(appControlRequirement, { ...validException, ...change } as Answer)).toBe(
      false,
    );
  });

  it('is rejected with a review date that does not exist', () => {
    expect(
      isValidAnswer(appControlRequirement, { ...validException, reviewDate: '2027-02-30' }),
    ).toBe(false);
    expect(
      isValidAnswer(appControlRequirement, { ...validException, reviewDate: '31/03/2027' }),
    ).toBe(false);
  });
});

describe('isMet', () => {
  it('counts Yes, Does not apply and exceptions as met', () => {
    expect(isMet({ value: 'yes' })).toBe(true);
    expect(isMet({ value: 'not-applicable', reason: 'x' })).toBe(true);
    expect(isMet(validException)).toBe(true);
  });

  it('never counts Partly, No or Not sure as met', () => {
    expect(isMet({ value: 'partly' })).toBe(false);
    expect(isMet({ value: 'no' })).toBe(false);
    expect(isMet({ value: 'not-sure' })).toBe(false);
  });
});
