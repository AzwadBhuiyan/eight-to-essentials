/**
 * Tests for the target level, adaptive skipping, product groups and skipped questions
 * (methodology D29 to D32).
 */
import { describe, expect, it } from 'vitest';
import { e8Requirements, productGroups } from '../data/index.ts';
import type { E8Requirement, MaturityLevel, Strategy } from '../data/types.ts';
import { isMet, validAnswerFor } from './answers.ts';
import { EMPTY_STATE, type AssessmentState } from './assessment.ts';
import { effectiveAnswers, inScope } from './effective.ts';
import { lowestLevel, scoreAll } from './scoring.ts';
import { allYes, no, notSure, partly, validException } from './test-helpers.ts';
import type { Answer, Answers } from './types.ts';

const levelOf = (answers: Answers, target: MaturityLevel, strategy: Strategy) =>
  scoreAll(e8Requirements, answers, target).strategies.find((s) => s.strategy === strategy)!;

const idsOf = (strategy: Strategy, target: MaturityLevel) =>
  inScope(e8Requirements, target)
    .filter((r) => r.strategies.includes(strategy))
    .map((r) => r.id);

describe('target level (D29)', () => {
  it('asks 46, 87 and 126 questions for targets ML1, ML2 and ML3', () => {
    expect(inScope(e8Requirements, 1)).toHaveLength(46);
    expect(inScope(e8Requirements, 2)).toHaveLength(87);
    expect(inScope(e8Requirements, 3)).toHaveLength(126);
  });

  it('never reports a strategy above the target', () => {
    for (const target of [1, 2] as const) {
      const result = scoreAll(e8Requirements, allYes(), target);
      expect(result.strategies.every((s) => s.level === target)).toBe(true);
      expect(result.headlineLevel).toBe(target);
    }
  });

  it('ignores answers above the target', () => {
    // ISM-1656 is ML3 only.
    expect(levelOf(allYes({ 'ISM-1656': no }), 1, 'Application control').level).toBe(1);
    expect(levelOf(allYes({ 'ISM-1656': no }), 3, 'Application control').level).toBe(2);
  });

  it('only needs answers up to the target to be complete', () => {
    const answers: Answers = {};
    for (const id of idsOf('Regular backups', 1)) answers[id] = { value: 'yes' };
    const result = levelOf(answers, 1, 'Regular backups');
    expect(result).toMatchObject({ status: 'complete', level: 1 });
    expect(levelOf(answers, 2, 'Regular backups').status).toBe('incomplete');
  });
});

describe('adaptive skipping (D30)', () => {
  it('settles Maturity Level Zero as soon as an ML1 requirement fails', () => {
    // Only one Application control question answered, and it fails.
    const result = levelOf({ 'ISM-0843': no }, 3, 'Application control');
    expect(result).toMatchObject({ status: 'complete', level: 0, cannotExceed: 0 });
    expect(result.requiredIds).toEqual([]);
    // Every other question for the strategy becomes "not needed".
    expect(result.notNeededIds).toHaveLength(idsOf('Application control', 3).length - 1);
  });

  it('still needs every requirement below the failed level', () => {
    // An ML2 requirement fails, but ML1 questions are unanswered.
    const result = levelOf({ 'ISM-1490': no }, 3, 'Application control');
    expect(result.status).toBe('incomplete');
    expect(result.level).toBeNull();
    expect(result.cannotExceed).toBe(1);
    expect(result.requiredRemainingIds.sort()).toEqual(['ISM-0843', 'ISM-1657', 'ISM-1870']);
  });

  it('gives the level below the failure once the lower levels are met', () => {
    const answers: Answers = { 'ISM-1490': partly };
    for (const id of ['ISM-0843', 'ISM-1657', 'ISM-1870']) answers[id] = { value: 'yes' };
    expect(levelOf(answers, 3, 'Application control')).toMatchObject({
      status: 'complete',
      level: 1,
    });
  });

  it('counts Partly and Not sure as failures, never as met', () => {
    expect(levelOf({ 'ISM-0843': partly }, 3, 'Application control').level).toBe(0);
    expect(levelOf({ 'ISM-0843': notSure }, 3, 'Application control').level).toBe(0);
  });

  it('lowers every strategy a shared control belongs to', () => {
    const result = scoreAll(e8Requirements, allYes({ 'ISM-1815': no }), 3);
    for (const s of result.strategies) {
      const shared = [
        'Multi-factor authentication',
        'Restrict administrative privileges',
        'Application control',
        'User application hardening',
      ].includes(s.strategy);
      expect(s.level, s.strategy).toBe(shared ? 1 : 3);
    }
  });
});

describe('skipped questions and partial results (D32)', () => {
  const stateWith = (change: Partial<AssessmentState>): AssessmentState => ({
    ...EMPTY_STATE,
    ...change,
  });

  it('treats a skipped question as unanswered, never as not met', () => {
    const answers = allYes();
    delete answers['ISM-0843'];
    const state = stateWith({ answers, skipped: ['ISM-0843'] });
    const { answers: effective } = effectiveAnswers(state, e8Requirements);
    const result = levelOf(effective, 3, 'Application control');
    expect(result.status).toBe('incomplete');
    expect(result.cannotExceed).toBeNull();
    expect(result.unmetIdsByLevel[1]).toEqual([]);
  });

  it('gives a provisional headline only when some strategies are complete', () => {
    const answers: Answers = {};
    for (const id of idsOf('Regular backups', 1)) answers[id] = { value: 'yes' };
    answers['ISM-0843'] = no; // Application control settles at ML0.
    const result = scoreAll(e8Requirements, answers, 1);
    expect(result.headlineLevel).toBeNull();
    expect(result.provisional).toEqual({ lowestCompleteLevel: 0, completeCount: 2 });
    expect(scoreAll(e8Requirements, {}, 1).provisional).toBeNull();
  });
});

describe('product groups (D31)', () => {
  const office = 'microsoft-office';
  const reason = 'We use Google Workspace; Microsoft Office is not installed anywhere';

  it('answers every group member as "Does not apply" with the shared reason', () => {
    const state = { ...EMPTY_STATE, productGroups: { [office]: { reason } } };
    const { answers, fromGroup } = effectiveAnswers(state, e8Requirements);
    const members = e8Requirements.filter((r) => r.naGroup === office);
    expect(members).toHaveLength(15);
    for (const r of members) {
      expect(answers[r.id]).toEqual({ value: 'not-applicable', reason });
      expect(fromGroup[r.id]).toBe(office);
    }
  });

  it("lets the user's own answer win over the group", () => {
    const state = {
      ...EMPTY_STATE,
      answers: { 'ISM-1671': no },
      productGroups: { [office]: { reason } },
    };
    const { answers, fromGroup } = effectiveAnswers(state, e8Requirements);
    expect(answers['ISM-1671']).toEqual(no);
    expect(fromGroup['ISM-1671']).toBeUndefined();
  });

  it('does not count a group without a reason', () => {
    const state = { ...EMPTY_STATE, productGroups: { [office]: { reason: '  ' } } };
    const { answers } = effectiveAnswers(state, e8Requirements);
    expect(
      validAnswerFor(
        e8Requirements.find((r) => r.id === 'ISM-1671')!,
        answers,
      ),
    ).toBe(undefined);
  });

  it('never answers a requirement that does not allow "Does not apply"', () => {
    const everyGroup = Object.fromEntries(productGroups.map((g) => [g.id, { reason }]));
    const { fromGroup } = effectiveAnswers(
      { ...EMPTY_STATE, productGroups: everyGroup },
      e8Requirements,
    );
    for (const id of Object.keys(fromGroup)) {
      expect(e8Requirements.find((r) => r.id === id)!.naAllowed, id).toBe(true);
    }
  });

  it('labels a strategy that reaches its level only through "Does not apply"', () => {
    const state = { ...EMPTY_STATE, answers: allYes(), productGroups: { [office]: { reason } } };
    for (const r of e8Requirements.filter((x) => x.naGroup === office)) delete state.answers[r.id];
    const { answers } = effectiveAnswers(state, e8Requirements);
    const macros = levelOf(answers, 1, 'Restrict Microsoft Office macros');
    expect(macros).toMatchObject({ level: 1, metOnlyThroughNotApplicable: true });
    expect(levelOf(answers, 1, 'Application control').metOnlyThroughNotApplicable).toBe(false);
  });
});

// ---------------------------------------------------------------- randomised comparison

/** Small seeded random number generator (mulberry32), so failures can be reproduced. */
function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The Phase 3 algorithm, restricted to the target: highest L where everything up to L is met. */
function oldLevel(
  own: E8Requirement[],
  answers: Answers,
  target: MaturityLevel,
): 0 | MaturityLevel {
  let level: 0 | MaturityLevel = 0;
  for (const L of [1, 2, 3] as const) {
    if (L > target) break;
    const allMet = own
      .filter((r) => lowestLevel(r) <= L)
      .every((r) => {
        const a = validAnswerFor(r, answers);
        return a !== undefined && isMet(a);
      });
    if (!allMet) break;
    level = L;
  }
  return level;
}

function randomAnswer(r: E8Requirement, rand: () => number): Answer {
  const pick = rand();
  if (pick < 0.45) return { value: 'yes' };
  if (pick < 0.55) return { value: 'partly' };
  if (pick < 0.65) return { value: 'no' };
  if (pick < 0.72) return { value: 'not-sure' };
  if (pick < 0.8 && r.naAllowed) return { value: 'not-applicable', reason: 'Not used here' };
  if (pick < 0.85) return { value: 'not-applicable', reason: '' }; // invalid: no reason
  if (pick < 0.92) return validException;
  return { ...validException, approvedBy: '' }; // invalid: no approver
}

/**
 * A random assessment. In "full" mode every question gets an own answer or a product group
 * answer with a reason, and nothing is skipped, so the old algorithm can be compared directly.
 */
function randomState(rand: () => number, full: boolean): AssessmentState {
  const target = (1 + Math.floor(rand() * 3)) as MaturityLevel;
  const productGroupsChosen: AssessmentState['productGroups'] = {};
  for (const g of productGroups) {
    if (rand() < 0.3)
      productGroupsChosen[g.id] = { reason: full || rand() < 0.7 ? 'Not used' : '' };
  }
  const answers: Answers = {};
  const skipped: string[] = [];
  for (const r of e8Requirements) {
    const coveredByGroup = r.naGroup !== null && productGroupsChosen[r.naGroup]?.reason;
    if (full) {
      if (!coveredByGroup || rand() < 0.3) {
        let answer = randomAnswer(r, rand);
        while (!validAnswerFor(r, { [r.id]: answer })) answer = randomAnswer(r, rand);
        answers[r.id] = answer;
      }
      continue;
    }
    const roll = rand();
    if (roll < 0.6) answers[r.id] = randomAnswer(r, rand);
    else if (roll < 0.8) skipped.push(r.id);
  }
  return {
    context: { ...EMPTY_STATE.context, targetLevel: target },
    answers,
    productGroups: productGroupsChosen,
    skipped,
  };
}

describe('randomised comparison with the old algorithm (D30)', () => {
  const RUNS = 400;
  const rand = random(20261020);

  it('agrees with the old rules and never claims an unsupported level', () => {
    let fullComparisons = 0;
    for (let run = 0; run < RUNS; run++) {
      const full = run % 2 === 0;
      const state = randomState(rand, full);
      const target = state.context.targetLevel;
      const { answers } = effectiveAnswers(state, e8Requirements);
      const result = scoreAll(e8Requirements, answers, target);

      for (const s of result.strategies) {
        const own = inScope(e8Requirements, target).filter((r) =>
          r.strategies.includes(s.strategy),
        );
        const label = `run ${run}, ${s.strategy}, target ML${target}`;

        // Never above the target; incomplete means no level.
        if (s.level !== null) expect(s.level, label).toBeLessThanOrEqual(target);
        if (s.status === 'incomplete') expect(s.level, label).toBeNull();

        if (s.level !== null) {
          // Sound: every requirement at or below the claimed level has a valid answer that is met.
          for (const r of own.filter((x) => lowestLevel(x) <= s.level!)) {
            const a = validAnswerFor(r, answers);
            expect(a !== undefined && isMet(a), `${label}, ${r.id}`).toBe(true);
          }
          // Tight: below the target, something at the next level was answered and not met.
          if (s.level < target) {
            const next = own.filter((x) => lowestLevel(x) === s.level! + 1);
            expect(
              next.some((r) => {
                const a = validAnswerFor(r, answers);
                return a !== undefined && !isMet(a);
              }),
              label,
            ).toBe(true);
          }
        }

        // With every question validly answered, the new rules give exactly the old result.
        if (own.every((r) => validAnswerFor(r, answers))) {
          fullComparisons++;
          expect(s.status, label).toBe('complete');
          expect(s.level, label).toBe(oldLevel(own, answers, target));
        }
      }

      // Skipped questions without an own answer, and groups without a reason, never count.
      for (const id of state.skipped) {
        if (!state.answers[id]) {
          const r = e8Requirements.find((x) => x.id === id)!;
          const viaGroup = r.naGroup !== null && state.productGroups[r.naGroup]?.reason.trim();
          if (!viaGroup) expect(validAnswerFor(r, answers), `run ${run}, ${id}`).toBeUndefined();
        }
      }
    }
    // Make sure the comparison really ran many times, not just the other checks.
    expect(fullComparisons).toBeGreaterThan(RUNS);
  });
});
