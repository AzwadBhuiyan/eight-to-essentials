import { describe, expect, it } from 'vitest';
import { e8Requirements, frameworkData } from '../data/index.ts';
import demoJson from '../data/demo-swan-river.json';
import type { Strategy } from '../data/types.ts';
import { validAnswerFor } from './answers.ts';
import { DEMO_LABEL, DEMO_PROFILE, DEMO_STATE } from './demo.ts';
import { effectiveAnswers, inScope } from './effective.ts';
import { evidenceRequests, exceptionsToReview } from './evidence.ts';
import { buildActionList } from './prioritise.ts';
import { scoreAll } from './scoring.ts';
import { buildTransition } from './transition.ts';

const target = DEMO_STATE.context.targetLevel;
const { answers, fromGroup } = effectiveAnswers(DEMO_STATE, e8Requirements);
const e8 = scoreAll(e8Requirements, answers, target);
const asked = inScope(e8Requirements, target);

describe('Swan River Analytics demo', () => {
  it('is labelled as fictional and uses the planned context answers', () => {
    expect(DEMO_LABEL).toBe('Fictional demo company');
    expect(DEMO_PROFILE.name).toBe('Swan River Analytics');
    expect(DEMO_PROFILE.source).toMatch(/Fictional company/);
    expect(DEMO_STATE.context).toEqual({
      organisationName: 'Swan River Analytics',
      e8ReportingRequired: 'yes',
      systemsLocation: 'own-hybrid-iaas',
      targetLevel: 2,
    });
  });

  it('produces exactly the planned levels, at target Maturity Level Two', () => {
    const levels = Object.fromEntries(e8.strategies.map((s) => [s.strategy, s.level]));
    const expected: Record<Strategy, number> = {
      'Multi-factor authentication': 1,
      'Patch operating systems': 2,
      'Patch applications': 1,
      'Regular backups': 1,
      'Restrict Microsoft Office macros': 1,
      'User application hardening': 0,
      'Restrict administrative privileges': 0,
      'Application control': 0,
    };
    expect(levels).toEqual(expected);
    expect(e8.strategies.every((s) => s.status === 'complete')).toBe(true);
    expect(e8.headlineLevel).toBe(0);
  });

  it('answers every question asked at its target, and nothing else', () => {
    for (const r of asked) expect(validAnswerFor(r, answers), r.id).toBeDefined();
    const askedIds = new Set(asked.map((r) => r.id));
    for (const id of Object.keys(demoJson.assessment.answers))
      expect(askedIds.has(id), id).toBe(true);
  });

  it('includes a few "Not sure" answers, one "Does not apply" and one exception', () => {
    const values = asked.map((r) => validAnswerFor(r, answers)!.value);
    expect(values.filter((v) => v === 'not-sure')).toHaveLength(3);
    expect(values.filter((v) => v === 'not-applicable')).toHaveLength(1);
    expect(values.filter((v) => v === 'exception')).toHaveLength(1);
    expect(Object.keys(fromGroup)).toHaveLength(0); // the "Does not apply" is justified individually
  });

  it('gives every results section content', () => {
    const actions = buildActionList(frameworkData, answers, DEMO_STATE.context, e8);
    expect(actions.title).toBe('Actions to lift your Essential Eight maturity');
    expect(actions.items.length).toBeGreaterThan(5);
    expect(evidenceRequests(asked, answers)).toHaveLength(3);
    const exceptions = exceptionsToReview(asked, answers, '2026-10-21', fromGroup);
    expect(exceptions.map((e) => e.answer.value).sort()).toEqual(['exception', 'not-applicable']);
  });

  it('gives a meaningful ASD Essentials transition view', () => {
    const transition = buildTransition(frameworkData, e8, answers);
    const statuses = new Set(
      transition.domains.flatMap((d) =>
        d.principles.flatMap((p) => p.actions.map((a) => a.status)),
      ),
    );
    // No row is "above target": the only rows needing ML3 belong to strategies below the target.
    for (const s of ['may-contribute', 'may-partly-contribute', 'gap', 'evidence-to-check']) {
      expect(statuses.has(s as never), s).toBe(true);
    }
    const findings = new Set(transition.domains.flatMap((d) => d.principles.map((p) => p.finding)));
    for (const f of ['already-effectively-addressed', 'partially-addressed', 'not-addressed']) {
      expect(findings.has(f as never), f).toBe(true);
    }
  });
});
