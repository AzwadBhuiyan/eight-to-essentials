import { describe, expect, it } from 'vitest';
import { e8Requirements } from '../data/index.ts';
import type { Strategy } from '../data/types.ts';
import { scoreAll } from './scoring.ts';
import { allYes, no, notSure, partly, validException } from './test-helpers.ts';
import type { Answers, E8Result } from './types.ts';

const levelOf = (result: E8Result, strategy: Strategy) =>
  result.strategies.find((s) => s.strategy === strategy)!.level;

const score = (answers: Answers) => scoreAll(e8Requirements, answers);

describe('strategy levels', () => {
  it('gives Maturity Level Three to every strategy when everything is met', () => {
    const result = score(allYes());
    expect(result.strategies.map((s) => s.level)).toEqual([3, 3, 3, 3, 3, 3, 3, 3]);
    expect(result.headlineLevel).toBe(3);
  });

  it('gives Maturity Level Zero when any Maturity Level One requirement is not met', () => {
    // ISM-0843: application control on workstations (ML1, ML2, ML3).
    const result = score(allYes({ 'ISM-0843': no }));
    expect(levelOf(result, 'Application control')).toBe(0);
  });

  it('gives Maturity Level Two when ML1 and ML2 are met but one ML3 requirement fails', () => {
    // ISM-1656: application control on non-internet-facing servers (ML3 only).
    const result = score(allYes({ 'ISM-1656': no }));
    expect(levelOf(result, 'Application control')).toBe(2);
  });

  it('gives Maturity Level One when an ML2 requirement fails', () => {
    // ISM-1490: application control on internet-facing servers (ML2 and ML3).
    expect(levelOf(score(allYes({ 'ISM-1490': no })), 'Application control')).toBe(1);
  });

  it('never counts Partly or Not sure as met', () => {
    expect(levelOf(score(allYes({ 'ISM-0843': partly })), 'Application control')).toBe(0);
    expect(levelOf(score(allYes({ 'ISM-0843': notSure })), 'Application control')).toBe(0);
  });

  it('counts "Does not apply" with a reason as met', () => {
    // ISM-1671: macros disabled for users without a business need (naAllowed).
    const result = score(
      allYes({ 'ISM-1671': { value: 'not-applicable', reason: 'No Microsoft Office in use' } }),
    );
    expect(levelOf(result, 'Restrict Microsoft Office macros')).toBe(3);
  });

  it('counts a complete exception as met', () => {
    expect(levelOf(score(allYes({ 'ISM-0843': validException })), 'Application control')).toBe(3);
  });

  it('treats a level-limited requirement as part of the levels it is listed at', () => {
    // ISM-1691 applies at ML1 and ML2 only. Failing it fails Maturity Level One.
    expect(levelOf(score(allYes({ 'ISM-1691': no })), 'Patch applications')).toBe(0);
  });
});

describe('shared controls', () => {
  it('lowers every strategy a shared control belongs to when answered "No"', () => {
    // ISM-1815 (event logs protected, ML2 and ML3) is shared by four strategies.
    const result = score(allYes({ 'ISM-1815': no }));
    expect(levelOf(result, 'Multi-factor authentication')).toBe(1);
    expect(levelOf(result, 'Restrict administrative privileges')).toBe(1);
    expect(levelOf(result, 'Application control')).toBe(1);
    expect(levelOf(result, 'User application hardening')).toBe(1);
    // Strategies that do not include it are unaffected.
    expect(levelOf(result, 'Regular backups')).toBe(3);
    expect(levelOf(result, 'Patch applications')).toBe(3);
  });

  it('lowers both patching strategies when the shared asset discovery control fails', () => {
    const result = score(allYes({ 'ISM-1807': no }));
    expect(levelOf(result, 'Patch applications')).toBe(0);
    expect(levelOf(result, 'Patch operating systems')).toBe(0);
  });
});

describe('headline', () => {
  it('equals the lowest strategy level', () => {
    const result = score(allYes({ 'ISM-1656': no, 'ISM-1173': no, 'ISM-1515': no }));
    // Application control ML2, MFA ML1 (ISM-1173 is ML2), Regular backups ML0 (ISM-1515 is ML1).
    expect(levelOf(result, 'Application control')).toBe(2);
    expect(levelOf(result, 'Multi-factor authentication')).toBe(1);
    expect(levelOf(result, 'Regular backups')).toBe(0);
    expect(result.headlineLevel).toBe(0);
  });
});

describe('incomplete strategies', () => {
  it('marks a strategy with an unanswered question as incomplete, not a level', () => {
    const answers = allYes();
    delete answers['ISM-0843'];
    const result = score(answers);
    const appControl = result.strategies.find((s) => s.strategy === 'Application control')!;
    expect(appControl.status).toBe('incomplete');
    expect(appControl.level).toBeNull();
    expect(appControl.unansweredIds).toEqual(['ISM-0843']);
    expect(result.headlineLevel).toBeNull();
  });

  it('treats an invalid answer as unanswered', () => {
    // "Does not apply" without a reason on a requirement that allows it.
    const result = score(allYes({ 'ISM-1671': { value: 'not-applicable', reason: '' } }));
    const macros = result.strategies.find(
      (s) => s.strategy === 'Restrict Microsoft Office macros',
    )!;
    expect(macros.status).toBe('incomplete');
    expect(macros.level).toBeNull();
  });

  it('marks every strategy incomplete when nothing is answered', () => {
    const result = score({});
    expect(result.strategies.every((s) => s.status === 'incomplete')).toBe(true);
    expect(result.headlineLevel).toBeNull();
  });
});
