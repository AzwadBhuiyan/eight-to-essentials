import { describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import App from '../App.tsx';
import type { MaturityLevel } from '../data/types.ts';
import { EMPTY_STATE } from '../lib/assessment.ts';
import { buildExport } from '../lib/importExport.ts';
import { STORAGE_KEY } from '../lib/storage.ts';
import { DISCLAIMER, MFA_PHISHING_RESISTANT_CAUTION, TRANSITION_BANNER } from '../lib/text.ts';
import { allYes } from '../lib/test-helpers.ts';
import type { Answers } from '../lib/types.ts';

/** Opens the app on the transition page with saved answers. */
async function openTransition(answers: Answers, target: MaturityLevel = 3) {
  const saved = buildExport(
    { ...EMPTY_STATE, context: { ...EMPTY_STATE.context, targetLevel: target }, answers },
    new Date('2026-10-20T00:00:00Z'),
  );
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  render(<App />);
  await act(async () => {
    window.location.hash = '/transition';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

describe('transition page', () => {
  it('shows the indicative-only banner and the disclaimer', async () => {
    await openTransition(allYes());
    expect(
      screen.getByRole('heading', { level: 1, name: 'ASD Essentials transition view' }),
    ).toBeInTheDocument();
    expect(screen.getByText(TRANSITION_BANNER)).toBeInTheDocument();
    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument();
  });

  it('groups domains by priority phase, phase 1 first', async () => {
    await openTransition(allYes());
    const phases = screen
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent)
      .filter(
        (t) => t?.startsWith('ASD Essentials priority') || t?.startsWith('ASD Essentials: all'),
      );
    expect(phases).toEqual([
      'ASD Essentials priority phase 1',
      'ASD Essentials: all phases (capability domains)',
      'ASD Essentials priority phase 2',
      'ASD Essentials priority phase 3',
    ]);
  });

  it('always labels partial rows as partial coverage, before the note, even with "strong" notes (D20)', async () => {
    await openTransition(allYes());
    const contributions = Array.from(document.querySelectorAll('li.contribution'));
    const partial = contributions.filter((li) =>
      li.textContent!.includes('contributing only in part'),
    );
    expect(partial.length).toBeGreaterThan(0);
    for (const li of partial) {
      const text = li.textContent!;
      const label = text.indexOf('Partial coverage in ');
      const note = text.indexOf("ASD's note (paraphrased)");
      expect(label, text).toBeGreaterThanOrEqual(0);
      expect(label, text).toBeLessThan(note);
      expect(text).not.toContain('May contribute');
      expect(text).not.toContain('Your E8 evidence may be reusable here');
    }
    // The nine partial rows whose note says "strong evidence" or "strong starting point".
    const strong = partial.filter((li) => /strong (evidence|starting point)/.test(li.textContent!));
    expect(strong).toHaveLength(9);
  });

  it('shows the phishing-resistant MFA caution on the Table 5 ML1 rows (D14)', async () => {
    await openTransition(allYes());
    expect(screen.getAllByText(MFA_PHISHING_RESISTANT_CAUTION).length).toBe(2);
  });

  it("shows how many of a principle's actions are mapped (D25)", async () => {
    await openTransition(allYes());
    expect(
      screen.getAllByText(/1 of 5 actions mapped; assess the rest separately/).length,
    ).toBeGreaterThan(0);
  });

  it('lists E8 evidence to check, with the answers given (D10)', async () => {
    await openTransition(allYes());
    const items = screen.getAllByText(
      /ASD cites these Essential Eight controls as possible evidence/,
    );
    expect(items.length).toBeGreaterThan(0);
    expect(document.body.textContent).toContain(
      'Your Essential Eight answer: Yes, and we can show evidence.',
    );
  });

  it('lists the 22 actions not covered by the Essential Eight', async () => {
    await openTransition(allYes());
    const section = screen
      .getByRole('heading', { name: 'ASD Essentials actions not covered by the Essential Eight' })
      .closest('section')!;
    const ids = new Set(
      Array.from(section.querySelectorAll('li .badge')).map((b) => b.textContent),
    );
    expect(ids.size).toBe(22);
    expect(ids.has('IT.IDE-01.2')).toBe(false);
  });

  it('shows strengthening points and principles with no action-level mapping (D13)', async () => {
    await openTransition(allYes());
    const section = screen
      .getByRole('heading', {
        name: 'ASD Essentials: where your Essential Eight work may need strengthening',
      })
      .closest('section')!;
    expect(section).toHaveTextContent(
      'ASD lists Legacy system management but gives no action-level mapping.',
    );
    expect(section).toHaveTextContent(
      'ASD lists Content filtering but gives no action-level mapping.',
    );
    expect(section).toHaveTextContent(
      'ASD lists Least privilege access but gives no action-level mapping.',
    );
  });

  it('marks rows above the target as not assessed (D33)', async () => {
    await openTransition(allYes(), 1);
    expect(screen.getAllByText('Not assessed (above your target)').length).toBeGreaterThan(0);
  });

  it('says when parts are based on incomplete answers', async () => {
    await openTransition({ 'ISM-0843': { value: 'no' } }, 1);
    expect(screen.getByText(/Some strategies are incomplete/)).toBeInTheDocument();
  });

  it('asks for answers first when nothing is answered', async () => {
    await openTransition({});
    expect(screen.getByText(/Answer the Essential Eight questions first/)).toBeInTheDocument();
  });

  it('never uses compliance language', async () => {
    await openTransition(allYes());
    expect(document.body.textContent).not.toMatch(
      /you are compliant|you meet ASD Essentials|certified/i,
    );
  });
});

describe('ASD Essentials labelling', () => {
  it('says clearly that this is ASD Essentials, not the Essential Eight result', async () => {
    await openTransition(allYes());
    expect(screen.getByRole('note')).toHaveTextContent(
      'You are looking at ASD Essentials for enterprise IT, not your Essential Eight result.',
    );
    expect(screen.getByRole('link', { name: 'See your Essential Eight result' })).toHaveAttribute(
      'href',
      '#/results',
    );
    expect(document.title).toBe('ASD Essentials transition view · Eight to Essentials');
  });

  it('names ASD Essentials in every section heading', async () => {
    await openTransition(allYes());
    for (const level of [1, 2, 3] as const) {
      for (const heading of screen.getAllByRole('heading', { level })) {
        expect(heading.textContent, heading.textContent ?? '').toContain('ASD Essentials');
      }
    }
  });

  it('names ASD Essentials on every domain, principle and action', async () => {
    await openTransition(allYes());
    for (const summary of document.querySelectorAll('details.domain > summary')) {
      expect(summary.textContent).toMatch(/^ASD Essentials domain: /);
    }
    for (const summary of document.querySelectorAll('details.principle > summary')) {
      expect(summary.textContent).toMatch(/^ASD Essentials principle /);
    }
    for (const title of document.querySelectorAll('.action__title')) {
      expect(title.textContent).toMatch(/^ASD Essentials action /);
    }
  });

  it("names the Essential Eight wherever it refers to the user's own results", async () => {
    await openTransition(allYes());
    for (const li of document.querySelectorAll('li.contribution')) {
      expect(li.textContent).toMatch(/^From your Essential Eight strategy /);
    }
    expect(document.body.textContent).not.toMatch(/Your answer:/);
  });
});

describe('results page link to the transition view', () => {
  it('offers the transition view as an optional next step', async () => {
    await openTransition(allYes());
    await act(async () => {
      window.location.hash = '/results';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(screen.getByRole('heading', { name: 'Next step (optional)' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'See how this carries into ASD Essentials' }),
    ).toHaveAttribute('href', '#/transition');
  });
});
