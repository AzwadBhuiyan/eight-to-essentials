import { describe, expect, it } from 'vitest';
import { e8ToEssentialsMap, frameworkData } from '../data/index.ts';
import type { Domain, Strategy } from '../data/types.ts';
import { buildTransition, rollUp, rowStatus } from './transition.ts';
import { mappedActionsNote } from './text.ts';
import { allYes, no, resultWithLevels } from './test-helpers.ts';
import type { MaturityLevel } from '../data/types.ts';
import type { ActionDomainStatus, TransitionResult } from './types.ts';

type Levels = Partial<Record<Strategy, 0 | MaturityLevel | null>>;

const transition = (levels: Levels, answers = allYes()) =>
  buildTransition(frameworkData, resultWithLevels(levels), answers);

function actionIn(result: TransitionResult, actionId: string, domain: Domain) {
  const group = result.domains.find((d) => d.domain === domain)!;
  for (const p of group.principles) {
    const found = p.actions.find((a) => a.actionId === actionId);
    if (found) return found;
  }
  throw new Error(`${actionId} not found in ${domain}`);
}

function principleIn(result: TransitionResult, principleId: string, domain: Domain) {
  return result.domains
    .find((d) => d.domain === domain)!
    .principles.find((p) => p.principleId === principleId)!;
}

describe('rowStatus', () => {
  const full = { contributingLevel: 2 as const, contribution: 'full' as const };
  const partial = { contributingLevel: 1 as const, contribution: 'partial' as const };

  it('shows a strategy below the listed level as a gap', () => {
    expect(rowStatus(full, 1)).toBe('gap');
    expect(rowStatus(partial, 0)).toBe('gap');
  });

  it('shows "may contribute" only for full rows at or above the listed level', () => {
    expect(rowStatus(full, 2)).toBe('may-contribute');
    expect(rowStatus(full, 3)).toBe('may-contribute');
  });

  it('never shows a partial contribution as "may contribute", at any level', () => {
    expect(rowStatus(partial, 3)).toBe('may-partly-contribute');
    for (const row of e8ToEssentialsMap.mappings.filter((m) => m.contribution === 'partial')) {
      for (const level of [0, 1, 2, 3] as const) {
        expect(rowStatus(row, level), row.id).not.toBe('may-contribute');
      }
    }
  });

  it('is unknown when the strategy is incomplete', () => {
    expect(rowStatus(full, null)).toBe('unknown');
  });
});

describe('partial rows with "strong" notes (methodology D20)', () => {
  it('stay partial even at Maturity Level Three', () => {
    // T5-05: PRO-13.4 in Identity services, partial at ML2, note says "strong evidence".
    const action = actionIn(transition({}), 'IT.PRO-13.4', 'Identity services');
    expect(action.status).toBe('may-partly-contribute');
    expect(action.contributions[0]).toMatchObject({ rowId: 'T5-05', contribution: 'partial' });
    expect(action.contributions[0]!.strengthenNote).toMatch(/strong evidence/);
  });
});

describe('several rows for one action and domain (methodology D15)', () => {
  // Table 7: PRO-07.1 in User devices is partial at ML1 and full at ML3 for macros.
  const macros = (level: 0 | 1 | 2 | 3) =>
    actionIn(
      transition({ 'Restrict Microsoft Office macros': level }),
      'IT.PRO-07.1',
      'User devices',
    ).contributions.find((c) => c.strategy === 'Restrict Microsoft Office macros')!;

  it('uses the highest row the strategy reaches', () => {
    expect(macros(3)).toMatchObject({ status: 'may-contribute', contributingLevel: 3 });
    expect(macros(2)).toMatchObject({ status: 'may-partly-contribute', contributingLevel: 1 });
    expect(macros(1)).toMatchObject({ status: 'may-partly-contribute', contributingLevel: 1 });
  });

  it('shows the lowest row as the gap to close when no row is reached', () => {
    expect(macros(0)).toMatchObject({ status: 'gap', contributingLevel: 1 });
  });
});

describe('patching rows (methodology D9)', () => {
  it('checks both patching strategies and lets the weaker result win', () => {
    const bothMet = actionIn(
      transition({ 'Patch applications': 1, 'Patch operating systems': 1 }),
      'IT.PRO-06.1',
      'Boundary services',
    );
    expect(bothMet.status).toBe('may-contribute');
    expect(bothMet.contributions.map((c) => c.strategy)).toEqual([
      'Patch applications',
      'Patch operating systems',
    ]);

    const osBehind = actionIn(
      transition({ 'Patch applications': 3, 'Patch operating systems': 0 }),
      'IT.PRO-06.1',
      'Boundary services',
    );
    expect(osBehind.status).toBe('gap');
  });
});

describe("roll-up to principles (author's rule, methodology D25)", () => {
  it('uses the weakest mapped action', () => {
    expect(rollUp(['may-contribute', 'may-partly-contribute'])).toBe('partially-addressed');
    expect(rollUp(['may-contribute', 'gap'])).toBe('not-addressed');
    expect(rollUp(['may-contribute', 'unknown'])).toBe('unknown');
    expect(rollUp(['may-contribute', 'may-contribute'])).toBe('already-effectively-addressed');
  });

  it('does not count an unmapped action as "not addressed"', () => {
    // "No E8 mapping" describes the framework, not the organisation.
    expect(rollUp(['may-contribute', 'no-e8-mapping'])).not.toBe('not-addressed');
    expect(rollUp(['may-partly-contribute', 'no-e8-mapping'])).toBe('partially-addressed');
    // A real gap in a mapped action still sets the finding.
    expect(rollUp(['gap', 'no-e8-mapping'])).toBe('not-addressed');
    expect(rollUp(['unknown', 'no-e8-mapping'])).toBe('unknown');
  });

  it('caps a principle with any unmapped action at "partially addressed"', () => {
    expect(rollUp(['may-contribute', 'no-e8-mapping'])).toBe('partially-addressed');
    // "Evidence to check" actions have no mapping row either, so they cap too.
    expect(rollUp(['may-contribute', 'evidence-to-check'])).toBe('partially-addressed');
  });

  it('never reads as fully addressed when any action is unmapped, for every combination', () => {
    const mapped = ['may-contribute', 'may-partly-contribute', 'gap', 'unknown'] as const;
    const unmapped = ['no-e8-mapping', 'evidence-to-check'] as const;
    // Every list of 1 to 3 mapped statuses, plus 1 or 2 unmapped statuses, in either order.
    const lists: ActionDomainStatus[][] = [];
    for (const a of mapped) {
      for (const u of unmapped) {
        lists.push([a, u], [u, a]);
        for (const b of mapped) {
          lists.push([a, b, u], [u, a, b]);
          for (const v of unmapped) {
            for (const c of mapped) lists.push([a, b, c, u, v]);
          }
        }
      }
    }
    for (const list of lists) {
      expect(rollUp(list), list.join(', ')).not.toBe('already-effectively-addressed');
    }
  });

  it('has its own findings when no action is mapped', () => {
    expect(rollUp(['no-e8-mapping', 'no-e8-mapping'])).toBe('no-e8-mapping');
    expect(rollUp(['evidence-to-check'])).toBe('evidence-to-check');
    expect(rollUp(['evidence-to-check', 'no-e8-mapping'])).toBe('evidence-to-check');
  });

  it('shows how many actions are mapped, with a note when some are not', () => {
    // PRO-13 in Boundary services: five actions, but only PRO-13.4 is mapped there (Table 5).
    const principle = principleIn(transition({}), 'PRO-13', 'Boundary services');
    expect(principle.applicableActionCount).toBe(5);
    expect(principle.mappedActionCount).toBe(1);
    expect(principle.finding).toBe('partially-addressed');
    expect(mappedActionsNote(principle.mappedActionCount, principle.applicableActionCount)).toBe(
      '1 of 5 actions mapped; assess the rest separately.',
    );
    expect(mappedActionsNote(3, 3)).toBeNull();
  });

  it('reads as fully addressed when every action is mapped and may contribute', () => {
    // IDE-01 in Visibility and response has one action, IT.IDE-01.1, mapped in full (Table 4).
    const principle = principleIn(transition({}), 'IDE-01', 'Visibility and response');
    expect(principle.mappedActionCount).toBe(1);
    expect(principle.applicableActionCount).toBe(1);
    expect(principle.finding).toBe('already-effectively-addressed');
  });

  it('never reads as fully addressed with unmapped actions, anywhere in the real data', () => {
    for (const levels of [{}, { 'Patch applications': 0 }, { 'Regular backups': 1 }] as Levels[]) {
      for (const group of transition(levels).domains) {
        for (const p of group.principles) {
          if (p.mappedActionCount < p.applicableActionCount) {
            expect(p.finding, `${p.principleId} in ${p.domain}`).not.toBe(
              'already-effectively-addressed',
            );
          }
        }
      }
    }
  });

  it('gives a principle with no mapped actions a framework finding, not "not addressed"', () => {
    // GOV-01 (Governance and culture) has no E8 mapping at all.
    expect(principleIn(transition({}), 'GOV-01', 'Governance and culture').finding).toBe(
      'no-e8-mapping',
    );
  });

  it('gives a principle linked to two strategies the lower status', () => {
    // PRO-04.1 in User devices is mapped from macros (Table 7) and user application hardening (Table 8).
    const both = transition({
      'Restrict Microsoft Office macros': 1,
      'User application hardening': 1,
    });
    expect(actionIn(both, 'IT.PRO-04.1', 'User devices').status).toBe('may-contribute');

    const oneBehind = transition({
      'Restrict Microsoft Office macros': 3,
      'User application hardening': 0,
    });
    expect(actionIn(oneBehind, 'IT.PRO-04.1', 'User devices').status).toBe('gap');
    expect(principleIn(oneBehind, 'PRO-04', 'User devices').finding).toBe('not-addressed');
  });

  it('is unknown when a contributing strategy is incomplete', () => {
    const result = transition({ 'Multi-factor authentication': null });
    expect(actionIn(result, 'IT.PRO-13.4', 'Boundary services').status).toBe('unknown');
  });
});

describe('actions without a mapping row', () => {
  it('shows "no E8 mapping" where ASD maps the action only in other domains', () => {
    // Table 4 maps PRO-06.1 in four domains, but not Identity services.
    expect(actionIn(transition({}), 'IT.PRO-06.1', 'Identity services').status).toBe(
      'no-e8-mapping',
    );
  });

  it("uses ASD's Table 4 row for IDE-01.1 in Visibility and response (D10 clarification)", () => {
    const action = actionIn(
      transition({ 'Patch applications': 1, 'Patch operating systems': 1 }),
      'IT.IDE-01.1',
      'Visibility and response',
    );
    expect(action.status).toBe('may-contribute');
  });

  it('lists E8 evidence to check, with the answers given, for other Visibility and response actions', () => {
    const result = transition({}, allYes({ 'ISM-1228': no }));
    const action = actionIn(result, 'IT.DET-03.1', 'Visibility and response');
    expect(action.status).toBe('evidence-to-check');
    expect(action.contributions).toEqual([]);
    expect(action.evidenceControls).toEqual([
      { id: 'ISM-0109', answer: 'yes' },
      { id: 'ISM-1228', answer: 'no' },
      { id: 'ISM-1906', answer: 'yes' },
      { id: 'ISM-1907', answer: 'yes' },
    ]);
  });
});

describe('Table 5 caution (methodology D14)', () => {
  it('flags the ML1 rows for phishing-resistant MFA', () => {
    const result = transition({});
    const bnd = actionIn(result, 'IT.PRO-13.4', 'Boundary services');
    expect(bnd.contributions[0]!.cautions).toEqual(['mfa-phishing-resistant-check']);
    const prv = actionIn(result, 'IT.PRO-13.4', 'Privileged environments');
    expect(prv.contributions[0]!.cautions).toEqual([]);
  });
});

describe('Not covered by the Essential Eight (methodology D12)', () => {
  const result = transition({});
  const allIds = new Set(
    result.notCovered.flatMap((g) => g.principles.flatMap((p) => p.actionIds)),
  );

  it('lists the 22 actions with no E8 coverage', () => {
    expect(allIds.size).toBe(22);
    expect(allIds.has('IT.IDE-01.2')).toBe(false);
  });

  it('lists PRO-09.2 only in the domains where it applies', () => {
    const domains = result.notCovered
      .filter((g) => g.principles.some((p) => p.actionIds.includes('IT.PRO-09.2')))
      .map((g) => g.domain);
    expect(domains).toEqual(['Boundary services', 'Critical processes and services']);
  });
});

describe('grouping by priority phase', () => {
  it('puts priority phase 1 first, then the capability domains, then phases 2 and 3', () => {
    expect(transition({}).domains.map((d) => d.domain)).toEqual([
      'Boundary services',
      'Identity services',
      'Governance and culture',
      'Visibility and response',
      'Critical processes and services',
      'Privileged environments',
      'Business systems',
      'User devices',
    ]);
  });

  it('covers every applicable principle in every domain', () => {
    const counts = transition({}).domains.map((d) => d.principles.length);
    expect(counts).toEqual([16, 16, 7, 10, 16, 16, 13, 10]);
  });
});
