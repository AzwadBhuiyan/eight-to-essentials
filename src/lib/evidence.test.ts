import { describe, expect, it } from 'vitest';
import { e8Requirements } from '../data/index.ts';
import { evidenceRequests, exceptionsToReview } from './evidence.ts';
import { allYes, notSure, validException } from './test-helpers.ts';

describe('evidence requests', () => {
  it('lists every requirement answered "Not sure"', () => {
    const answers = allYes({ 'ISM-1515': notSure, 'ISM-1173': notSure });
    const ids = evidenceRequests(e8Requirements, answers).map((e) => e.requirement.id);
    expect(ids.sort()).toEqual(['ISM-1173', 'ISM-1515']);
  });
});

describe('exceptions to review', () => {
  const na = { value: 'not-applicable' as const, reason: 'No Microsoft Office in use' };

  it('lists "Does not apply" with a reason, and complete exceptions', () => {
    const answers = allYes({ 'ISM-1671': na, 'ISM-0843': validException });
    const items = exceptionsToReview(e8Requirements, answers, '2026-10-20');
    expect(items.map((i) => [i.requirement.id, i.answer.value])).toEqual([
      ['ISM-0843', 'exception'],
      ['ISM-1671', 'not-applicable'],
    ]);
  });

  it('leaves out invalid answers, which count as unanswered', () => {
    const answers = allYes({ 'ISM-0843': { ...validException, approvedBy: '' } });
    expect(exceptionsToReview(e8Requirements, answers, '2026-10-20')).toEqual([]);
  });

  it('flags an exception whose review date has passed', () => {
    const answers = allYes({ 'ISM-0843': { ...validException, reviewDate: '2026-10-19' } });
    const [item] = exceptionsToReview(e8Requirements, answers, '2026-10-20');
    expect(item?.reviewOverdue).toBe(true);
  });

  it('does not flag an exception reviewed today or later', () => {
    const answers = allYes({ 'ISM-0843': { ...validException, reviewDate: '2026-10-20' } });
    const [item] = exceptionsToReview(e8Requirements, answers, '2026-10-20');
    expect(item?.reviewOverdue).toBe(false);
  });
});
