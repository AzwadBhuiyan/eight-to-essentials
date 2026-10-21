import { describe, expect, it } from 'vitest';
import { e8Requirements } from '../data/index.ts';
import { frameworkData } from '../data/framework.ts';
import { buildActionList as build } from './prioritise.ts';
import { scoreAll } from './scoring.ts';
import type { Answers, AssessmentContext } from './types.ts';
import { ACTION_LIST_TITLE, SUPERSEDED_TARGET_ADVICE } from './text.ts';
import { allYes, no, notSure, partly } from './test-helpers.ts';

/** Builds the action list at target Maturity Level Three, so every question is in scope. */
function buildActionList(
  data: typeof frameworkData,
  answers: Answers,
  context: Pick<AssessmentContext, 'e8ReportingRequired'>,
) {
  return build(data, answers, context, scoreAll(e8Requirements, answers, 3));
}

// Requirements chosen for their level, exposure and effort tags:
//   ISM-1807  ML1  other     moderate
//   ISM-1808  ML1  other     quick-win
//   ISM-1698  ML1  boundary  moderate
//   ISM-1504  ML1  identity  quick-win
//   ISM-1173  ML2  identity  quick-win
//   ISM-1622  ML3  other     project
const unmet = allYes({
  'ISM-1807': no,
  'ISM-1808': no,
  'ISM-1698': no,
  'ISM-1504': no,
  'ISM-1173': no,
  'ISM-1622': no,
});

const ids = (list: ReturnType<typeof buildActionList>) => list.items.map((i) => i.requirement.id);

describe('action list order', () => {
  const list = buildActionList(frameworkData, unmet, { e8ReportingRequired: 'yes' });

  it('puts ML1 gaps before ML2, before ML3; boundary and identity first; quick wins first', () => {
    expect(ids(list)).toEqual([
      'ISM-1504', // ML1, identity, quick win
      'ISM-1698', // ML1, boundary, moderate
      'ISM-1808', // ML1, other, quick win
      'ISM-1807', // ML1, other, moderate
      'ISM-1173', // ML2
      'ISM-1622', // ML3
    ]);
  });

  it('only includes answered requirements that are not met', () => {
    const answers = allYes({ 'ISM-1504': partly, 'ISM-1173': notSure });
    delete answers['ISM-1808'];
    expect(
      ids(buildActionList(frameworkData, answers, { e8ReportingRequired: 'yes' })).sort(),
    ).toEqual(['ISM-1173', 'ISM-1504']);
  });

  it('shows the related ASD Essentials principles', () => {
    const item = list.items.find((i) => i.requirement.id === 'ISM-1504')!;
    expect(item.relatedPrinciples).toEqual([
      { id: 'PRO-13', title: 'Identity, credential and access management' },
    ]);
  });

  it('gives a next step that depends on the answer', () => {
    const answers = allYes({ 'ISM-1504': partly, 'ISM-1173': notSure, 'ISM-1808': no });
    const items = buildActionList(frameworkData, answers, { e8ReportingRequired: 'yes' }).items;
    const step = (id: string) => items.find((i) => i.requirement.id === id)!.nextStep;
    expect(step('ISM-1504')).toMatch(/^Extend this/);
    expect(step('ISM-1173')).toMatch(/^Find out whether this is in place/);
    expect(step('ISM-1808')).toMatch(/^Plan and put this in place/);
  });
});

describe('action list framing (context question 2)', () => {
  it('is "Actions to lift your Essential Eight maturity" when E8 reporting is still required', () => {
    const list = buildActionList(frameworkData, unmet, { e8ReportingRequired: 'yes' });
    expect(list.framing).toBe('lift-e8-maturity');
    expect(list.title).toBe(ACTION_LIST_TITLE['lift-e8-maturity']);
    expect(list.advice).toBeNull();
  });

  it.each(['no', 'not-sure'] as const)(
    'is "Risk-reduction actions" with ASD\'s advice when the answer is "%s"',
    (e8ReportingRequired) => {
      const list = buildActionList(frameworkData, unmet, { e8ReportingRequired });
      expect(list.framing).toBe('risk-reduction');
      expect(list.title).toBe('Risk-reduction actions');
      expect(list.advice).toBe(SUPERSEDED_TARGET_ADVICE);
    },
  );

  it('puts items linked to a priority phase 1 domain first in the risk-reduction list', () => {
    // E8MM-2023-01 (ML1, boundary, project) has no Essentials action links.
    // ISM-1622 (ML3) links to actions that apply in Boundary services and Identity services.
    const answers = allYes({ 'E8MM-2023-01': no, 'ISM-1622': no });
    const lift = buildActionList(frameworkData, answers, { e8ReportingRequired: 'yes' });
    const risk = buildActionList(frameworkData, answers, { e8ReportingRequired: 'no' });
    expect(ids(lift)).toEqual(['E8MM-2023-01', 'ISM-1622']);
    expect(ids(risk)).toEqual(['ISM-1622', 'E8MM-2023-01']);
    expect(risk.items.map((i) => i.linkedToPhase1)).toEqual([true, false]);
  });
});

describe('target, adaptive skipping and skipped questions (D29, D30, D32)', () => {
  it('only lists requirements up to the target', () => {
    // ISM-1173 is ML2, ISM-1504 is ML1.
    const answers = allYes({ 'ISM-1504': no, 'ISM-1173': no });
    const list = build(
      frameworkData,
      answers,
      { e8ReportingRequired: 'yes' },
      scoreAll(e8Requirements, answers, 1),
    );
    expect(ids(list)).toEqual(['ISM-1504']);
  });

  it('counts questions that were not needed or were skipped', () => {
    // Application control fails at ML1 with nothing else answered, so its other questions are not needed.
    // Regular backups has one required question skipped.
    const answers: Answers = { 'ISM-0843': no };
    const e8 = scoreAll(e8Requirements, answers, 1);
    const list = build(frameworkData, answers, { e8ReportingRequired: 'yes' }, e8, ['ISM-1511']);
    expect(list.notNeededCount).toBe(2); // ISM-1870 and ISM-1657
    expect(list.skippedCount).toBe(1);
  });
});
