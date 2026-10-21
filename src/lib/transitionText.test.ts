import { describe, expect, it } from 'vitest';
import { frameworkData } from '../data/framework.ts';
import { buildTransition } from './transition.ts';
import { actionStatusLabel, contributionLabel, findingLabel } from './transitionText.ts';
import { allYes, resultWithLevels } from './test-helpers.ts';

describe('transition labels', () => {
  it('always labels partial coverage with the domain (D20)', () => {
    expect(contributionLabel('may-partly-contribute', 'Identity services')).toBe(
      'Partial coverage in Identity services',
    );
  });

  it('labels every partial contribution in the real data as partial, at every level', () => {
    for (const level of [1, 2, 3] as const) {
      const result = buildTransition(frameworkData, resultWithLevels({}, level), allYes());
      for (const group of result.domains) {
        for (const p of group.principles) {
          for (const a of p.actions) {
            for (const c of a.contributions) {
              const label = contributionLabel(c.status, a.domain);
              if (c.contribution === 'partial') {
                expect(label, `${c.rowId} at ML${level}`).not.toBe('May contribute');
                if (c.status === 'may-partly-contribute') {
                  expect(label).toBe(`Partial coverage in ${a.domain}`);
                }
              }
            }
          }
        }
      }
    }
  });

  it('uses "may" or "check" wording, never claims of compliance', () => {
    const labels = [
      ...(
        [
          'already-effectively-addressed',
          'partially-addressed',
          'not-addressed',
          'unknown',
          'evidence-to-check',
          'no-e8-mapping',
        ] as const
      ).map(findingLabel),
      actionStatusLabel('evidence-to-check', 'Boundary services'),
      actionStatusLabel('no-e8-mapping', 'Boundary services'),
    ];
    for (const label of labels) {
      expect(label).not.toMatch(/complian|meets|certif/i);
    }
    expect(findingLabel('already-effectively-addressed')).toMatch(/^May /);
    expect(findingLabel('partially-addressed')).toMatch(/^May /);
  });
});
