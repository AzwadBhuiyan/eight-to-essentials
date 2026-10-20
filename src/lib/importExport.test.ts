import { describe, expect, it } from 'vitest';
import { e8Requirements } from '../data/index.ts';
import { EMPTY_CONTEXT, type AssessmentState } from './assessment.ts';
import { MAX_IMPORT_BYTES, answersToCsv, buildExport, parseImport } from './importExport.ts';
import { validException } from './test-helpers.ts';

const state: AssessmentState = {
  context: { ...EMPTY_CONTEXT, organisationName: 'Example Pty Ltd', e8ReportingRequired: 'yes' },
  answers: {
    'ISM-0843': { value: 'yes' },
    'ISM-1671': { value: 'not-applicable', reason: 'No Microsoft Office' },
    'ISM-1490': validException,
  },
};
const now = new Date('2026-10-20T01:02:03.000Z');
const json = (value: unknown) => JSON.stringify(value);
const parse = (value: unknown) => {
  const text = typeof value === 'string' ? value : json(value);
  return parseImport(text, text.length, e8Requirements);
};

describe('export and import', () => {
  it('round-trips an assessment', () => {
    const result = parse(buildExport(state, now));
    expect(result).toEqual({ ok: true, state });
  });

  it('accepts work-in-progress answers that break the answer rules', () => {
    const exported = buildExport(
      { ...state, answers: { 'ISM-0843': { ...validException, approvedBy: '' } } },
      now,
    );
    expect(parse(exported).ok).toBe(true);
  });
});

describe('import rejects bad files', () => {
  const good = buildExport(state, now);

  it('rejects a file over 1 MB without parsing it', () => {
    const result = parseImport('{}', MAX_IMPORT_BYTES + 1, e8Requirements);
    expect(result).toEqual({ ok: false, errors: ['The file is larger than 1 MB.'] });
  });

  it('rejects text over 1 MB even if the reported size is small', () => {
    const big = ' '.repeat(MAX_IMPORT_BYTES + 1);
    expect(parseImport(big, 10, e8Requirements).ok).toBe(false);
  });

  it('rejects something that is not JSON', () => {
    expect(parse('not json')).toEqual({ ok: false, errors: ['The file is not valid JSON.'] });
  });

  it('rejects unknown fields at the top level', () => {
    expect(parse({ ...good, extra: true }).ok).toBe(false);
  });

  it('rejects unknown fields inside an answer', () => {
    const answers = { 'ISM-0843': { value: 'yes', note: 'hello' } };
    expect(parse({ ...good, answers }).ok).toBe(false);
  });

  it('rejects unknown fields inside the context', () => {
    expect(parse({ ...good, context: { ...good.context, email: 'x@example.test' } }).ok).toBe(
      false,
    );
  });

  it('rejects wrong types', () => {
    expect(parse({ ...good, version: '1' }).ok).toBe(false);
    expect(parse({ ...good, answers: { 'ISM-0843': { value: 'maybe' } } }).ok).toBe(false);
    expect(parse({ ...good, context: { ...good.context, organisationName: 42 } }).ok).toBe(false);
    expect(parse([]).ok).toBe(false);
  });

  it('rejects answers for unknown requirements', () => {
    const result = parse({ ...good, answers: { 'ISM-9999': { value: 'yes' } } });
    expect(result.ok).toBe(false);
  });

  it('rejects files from another tool', () => {
    expect(parse({ ...good, format: 'something-else' }).ok).toBe(false);
  });

  it('rejects very long text fields', () => {
    const context = { ...good.context, organisationName: 'x'.repeat(201) };
    expect(parse({ ...good, context }).ok).toBe(false);
  });
});

describe('answers CSV export', () => {
  it('has a title, a header and one row per requirement', () => {
    const lines = answersToCsv(state, e8Requirements).trimEnd().split('\r\n');
    expect(lines).toHaveLength(2 + e8Requirements.length);
    expect(lines[0]).toContain('Self-assessment, not an official assessment.');
  });

  it('neutralises formula-like text the user typed', () => {
    const malicious: AssessmentState = {
      context: { ...EMPTY_CONTEXT, organisationName: '=cmd|/c calc' },
      answers: { 'ISM-1671': { value: 'not-applicable', reason: '@SUM(1+1)' } },
    };
    const csv = answersToCsv(malicious, e8Requirements);
    expect(csv).toContain('"\'@SUM(1+1)"');
    expect(csv).not.toMatch(/(^|,)"[=+\-@]/m);
  });
});
