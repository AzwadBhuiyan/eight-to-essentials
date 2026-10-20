import { describe, expect, it } from 'vitest';
import { e8Requirements, frameworkData, productGroups } from '../data/index.ts';
import type { MaturityLevel } from '../data/types.ts';
import { EMPTY_CONTEXT } from './assessment.ts';
import { inScope } from './effective.ts';
import { evidenceRequests, exceptionsToReview } from './evidence.ts';
import { buildActionList } from './prioritise.ts';
import { RESULTS_CSV_HEADER, resultsToCsv } from './resultsCsv.ts';
import { scoreAll } from './scoring.ts';
import { LEVEL_NAMES } from './text.ts';
import { allYes, no, notSure, validException } from './test-helpers.ts';
import type { AssessmentContext, Answers } from './types.ts';

type Column = (typeof RESULTS_CSV_HEADER)[number];

function csvFor(
  answers: Answers,
  {
    target = 1,
    organisationName = 'Example Pty Ltd',
    e8ReportingRequired = 'yes',
  }: {
    target?: MaturityLevel;
    organisationName?: string;
    e8ReportingRequired?: AssessmentContext['e8ReportingRequired'];
  } = {},
) {
  const context = { ...EMPTY_CONTEXT, organisationName, e8ReportingRequired, targetLevel: target };
  const e8 = scoreAll(e8Requirements, answers, target);
  const asked = inScope(e8Requirements, target);
  return resultsToCsv({
    context,
    e8,
    actionList: buildActionList(frameworkData, answers, context, e8),
    evidence: evidenceRequests(asked, answers),
    exceptions: exceptionsToReview(asked, answers, '2026-10-20'),
    productGroups,
  });
}

/** Parses the CSV back into rows of cells. Cells never contain line breaks in these tests. */
function parse(csv: string): Record<Column, string>[] {
  const lines = csv.trimEnd().split('\r\n');
  const cells = (line: string) =>
    line
      .slice(1, -1)
      .split('","')
      .map((c) => c.replace(/""/g, '"'));
  const header = cells(lines[0]!) as Column[];
  expect(header).toEqual([...RESULTS_CSV_HEADER]);
  return lines.slice(1).map((line) => {
    const values = cells(line);
    expect(values, line).toHaveLength(header.length);
    return Object.fromEntries(header.map((h, i) => [h, values[i]!])) as Record<Column, string>;
  });
}

const sample = allYes({ 'ISM-0843': no, 'ISM-1511': notSure, 'ISM-1504': validException });

describe('results CSV layout', () => {
  const rows = parse(csvFor(sample));

  it('uses the agreed header', () => {
    expect([...RESULTS_CSV_HEADER]).toEqual([
      'Section',
      'Strategy',
      'Requirement ID',
      'Item',
      'Strategy level',
      'Requirement level',
      'Status',
      'Details',
    ]);
  });

  it('starts with a Note row carrying the disclaimer in the Item column', () => {
    expect(rows[0]!.Section).toBe('Note');
    expect(rows[0]!.Item).toContain('Eight to Essentials results for Example Pty Ltd.');
    expect(rows[0]!.Item).toContain('Self-assessment. Not an official ASD assessment');
  });

  it('uses single-word section names only', () => {
    const sections = new Set(rows.map((r) => r.Section));
    for (const s of sections) {
      expect(['Note', 'Headline', 'Strategy', 'Action', 'Evidence', 'Exception']).toContain(s);
    }
  });

  it('has one headline row and one row per strategy, with strategy levels only there', () => {
    expect(rows.filter((r) => r.Section === 'Headline')).toHaveLength(1);
    const strategies = rows.filter((r) => r.Section === 'Strategy');
    expect(strategies).toHaveLength(8);
    for (const r of strategies) expect(r['Requirement level']).toBe('');
    const appControl = strategies.find((r) => r.Strategy === 'Application control')!;
    expect(appControl['Strategy level']).toBe('Maturity Level Zero');
    expect(appControl.Status).toBe('Complete');
    expect(appControl.Details).toBe('Target: Maturity Level One');
  });

  it('puts the action list framing in a Note row just before the actions', () => {
    const firstAction = rows.findIndex((r) => r.Section === 'Action');
    expect(rows[firstAction - 1]).toMatchObject({
      Section: 'Note',
      Item: 'Actions to lift your Essential Eight maturity',
    });
    const riskRows = parse(csvFor(sample, { e8ReportingRequired: 'no' }));
    const note = riskRows[riskRows.findIndex((r) => r.Section === 'Action') - 1]!;
    expect(note.Item).toBe('Risk-reduction actions');
    expect(note.Details).toContain('superseded Essential Eight target');
  });

  it('fills the requirement level for actions and evidence, never the strategy level', () => {
    const action = rows.find((r) => r.Section === 'Action' && r['Requirement ID'] === 'ISM-0843')!;
    expect(action['Requirement level']).toBe('Maturity Level One');
    expect(action['Strategy level']).toBe('');
    expect(action.Details).toContain('Effort (our estimate)');
    const evidence = rows.find((r) => r.Section === 'Evidence')!;
    expect(evidence['Requirement ID']).toBe('ISM-1511');
    expect(evidence['Requirement level']).toBe('Maturity Level One');
    expect(evidence['Strategy level']).toBe('');
  });

  it('includes exceptions', () => {
    const exception = rows.find((r) => r.Section === 'Exception')!;
    expect(exception['Requirement ID']).toBe('ISM-1504');
    expect(exception.Status).toBe('Exception with compensating control');
  });
});

describe('results CSV headline row', () => {
  const headlineOf = (answers: Answers, target: MaturityLevel) =>
    parse(csvFor(answers, { target })).find((r) => r.Section === 'Headline')!;

  it('shows the provisional level, "Not final" and the target in Details', () => {
    // Only Application control is complete (at ML0); target ML1.
    const row = headlineOf({ 'ISM-0843': no }, 1);
    expect(row['Strategy level']).toBe('Maturity Level Zero');
    expect(row.Status).toBe('Not final');
    expect(row.Details).toBe('Target: Maturity Level One');
  });

  it('shows the final level and "Final" once every strategy is complete', () => {
    const row = headlineOf(allYes({ 'ISM-1173': no }), 2); // MFA ML1, the rest ML2
    expect(row['Strategy level']).toBe('Maturity Level One');
    expect(row.Status).toBe('Final');
    expect(row.Details).toBe('Target: Maturity Level Two');
  });

  it('leaves the level empty when no strategy is complete', () => {
    const row = headlineOf({}, 2);
    expect(row['Strategy level']).toBe('');
    expect(row.Status).toBe('Not final');
  });

  it('never shows the target as the level unless the headline really is at the target', () => {
    const cases: [Answers, MaturityLevel][] = [
      [{}, 1],
      [{}, 3],
      [{ 'ISM-0843': no }, 1],
      [{ 'ISM-0843': no }, 3],
      [allYes({ 'ISM-1173': no }), 2],
      [allYes({ 'ISM-1656': no }), 3],
      [allYes(), 1],
      [allYes(), 3],
    ];
    for (const [answers, target] of cases) {
      const e8 = scoreAll(e8Requirements, answers, target);
      const expected = e8.headlineLevel ?? e8.provisional?.lowestCompleteLevel ?? null;
      const row = headlineOf(answers, target);
      expect(row['Strategy level']).toBe(expected === null ? '' : LEVEL_NAMES[expected]);
      if (row['Strategy level'] === LEVEL_NAMES[target]) {
        expect(expected).toBe(target);
      }
    }
  });
});

describe('results CSV safety', () => {
  it('neutralises formula-like text the user typed', () => {
    const csv = csvFor(
      allYes({ 'ISM-1504': { ...validException, reason: '=HYPERLINK("http://x.test")' } }),
      { organisationName: '+cmd' },
    );
    expect(csv).not.toMatch(/(^|,)"[=+\-@]/m);
    expect(csv).toContain('Eight to Essentials results for +cmd.');
  });
});
