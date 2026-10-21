/** Tests for the Phase 6b UX pass: home page, journey indicator, strategy introductions and labels. */
import { describe, expect, it } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import App from '../App.tsx';
import { STRATEGIES, type MaturityLevel } from '../data/types.ts';
import { EMPTY_STATE } from '../lib/assessment.ts';
import { buildExport } from '../lib/importExport.ts';
import { EXPLAINER, HOW_IT_WORKS, STRATEGY_INTROS } from '../lib/siteText.ts';
import { STORAGE_KEY } from '../lib/storage.ts';
import { DISCLAIMER } from '../lib/text.ts';
import { allYes } from '../lib/test-helpers.ts';
import type { Answers } from '../lib/types.ts';

async function go(path: string) {
  await act(async () => {
    window.location.hash = path;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

function saveAnswers(answers: Answers, target: MaturityLevel = 1) {
  const saved = buildExport(
    { ...EMPTY_STATE, context: { ...EMPTY_STATE.context, targetLevel: target }, answers },
    new Date('2026-10-21T00:00:00Z'),
  );
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
}

describe('home page (D36)', () => {
  it('has the plain headline', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Find your Essential Eight level, and see what it means for ASD Essentials.',
    );
  });

  it('shows the demo company preview, clearly labelled as fictional', () => {
    render(<App />);
    const preview = screen.getByText('Example result: Fictional demo company').closest('section')!;
    expect(preview).toHaveTextContent('Swan River Analytics is a fictional company');
    expect(
      within(preview).getByRole('link', { name: 'See the full example result' }),
    ).toHaveAttribute('href', '#/example');
  });

  it('shows the three how-it-works steps in order', () => {
    render(<App />);
    const section = screen.getByRole('heading', { name: 'How it works' }).closest('section')!;
    const steps = within(section)
      .getAllByRole('listitem')
      .map((li) => li.textContent);
    expect(steps).toEqual(HOW_IT_WORKS.map((s, i) => `${i + 1}${s}`));
    expect(steps[2]).toContain('(optional)');
  });

  it('sources every factual sentence in the explainer', () => {
    render(<App />);
    const section = screen
      .getByRole('heading', { name: 'The Essential Eight and ASD Essentials' })
      .closest('section')!;
    const items = within(section).getAllByRole('listitem');
    expect(items).toHaveLength(EXPLAINER.length);
    expect(items[0]).toHaveTextContent(
      'ASD describes the Essential Eight as the most effective of its strategies to mitigate cyber security incidents.',
    );
    expect(within(items[0]!).getByRole('link')).toHaveAttribute(
      'href',
      'https://www.cyber.gov.au/publication/essential-eight-maturity-model',
    );
    // Every sentence except the last (about this tool) links to a source.
    EXPLAINER.forEach((sentence, i) => {
      const links = within(items[i]!).queryAllByRole('link');
      expect(links.length, sentence.text).toBe(sentence.sources.length);
    });
    expect(EXPLAINER.slice(0, -1).every((s) => s.sources.length > 0)).toBe(true);
  });

  it('sets expectations: question count from the data, time, saving and privacy', () => {
    render(<App />);
    const section = screen.getByRole('heading', { name: 'What to expect' }).closest('section')!;
    expect(section).toHaveTextContent(
      '46 questions at the default target (Maturity Level One), often fewer.',
    );
    expect(section).toHaveTextContent('About 20 to 30 minutes (our estimate).');
    expect(section).toHaveTextContent('Save your progress on this device and come back later');
    expect(section).toHaveTextContent('Nothing you enter leaves your browser.');
  });

  it('has two clear buttons to the assessment and the example', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: 'Start my assessment' })).toHaveAttribute(
      'href',
      '#/context',
    );
    expect(screen.getByRole('link', { name: 'See an example result' })).toHaveAttribute(
      'href',
      '#/example',
    );
  });

  it('pairs the trust line with CC BY 4.0 and "not affiliated or endorsed"', () => {
    render(<App />);
    const trust = screen
      .getByRole('heading', { name: "Built on ASD's publicly available guidance" })
      .closest('section')!;
    expect(
      within(trust)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href')),
    ).toEqual([
      'https://www.cyber.gov.au/publication/essential-eight-maturity-model',
      'https://www.cyber.gov.au/publication/essentials-for-enterprise-it',
      'https://www.cyber.gov.au/publication/transitioning-from-the-essential-eight',
      'https://creativecommons.org/licenses/by/4.0/',
    ]);
    expect(trust).toHaveTextContent('Not affiliated with or endorsed by');
  });

  it('shows the disclaimer and no images that could look like government branding', () => {
    render(<App />);
    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument();
    // The only images are the app's own "8 → E" logo (and, on screen, the demo's radar chart):
    // no crests, government logos or other pictures.
    const images = Array.from(document.querySelectorAll('img, svg'));
    expect(images.length).toBe(1);
    expect(images[0]!.hasAttribute('data-logo')).toBe(true);
    expect(images[0]!.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('journey indicator (D38)', () => {
  it.each([
    ['/context', 'Step 1 of 3: Essential Eight questions'],
    ['/assessment/1', 'Step 1 of 3: Essential Eight questions'],
    ['/results', 'Step 2 of 3: Your Essential Eight result'],
    ['/transition', 'Step 3 of 3: ASD Essentials (optional)'],
  ])('shows the right step on %s', async (path, text) => {
    saveAnswers(allYes());
    render(<App />);
    await go(path);
    const nav = screen.getByRole('navigation', { name: 'Your progress' });
    expect(nav).toHaveTextContent(text);
    expect(
      within(nav).getByText((_, el) => el?.getAttribute('aria-current') === 'step'),
    ).toBeInTheDocument();
  });
});

describe('strategy introductions (D37)', () => {
  it.each(STRATEGIES.map((s, i) => [i + 1, s] as const))(
    'step %i shows "Strategy n of 8", the Essential Eight tag and the introduction',
    async (step, strategy) => {
      render(<App />);
      await go(`/assessment/${step}`);
      expect(screen.getByText(new RegExp(`Strategy ${step} of 8`))).toBeInTheDocument();
      expect(screen.getAllByText('Essential Eight').length).toBeGreaterThan(0);
      const intro = screen.getByText(STRATEGY_INTROS[strategy]);
      expect(intro.textContent).not.toMatch(/\?$/); // a statement, not a question
    },
  );
});

describe('Essential Eight and ASD Essentials labels (D38)', () => {
  it('tags every results section as Essential Eight', async () => {
    saveAnswers(allYes({ 'ISM-0843': { value: 'not-sure' } }));
    render(<App />);
    await go('/results');
    const sections = Array.from(document.querySelectorAll('main section')).filter(
      (s) => !s.classList.contains('panel'),
    );
    expect(sections.length).toBeGreaterThanOrEqual(4);
    for (const section of sections) {
      const tag = section.querySelector('.framework-tag');
      expect(tag?.textContent, section.querySelector('h2')?.textContent ?? '').toBe(
        'Essential Eight',
      );
    }
    // The optional next-step card is tagged as ASD Essentials.
    const nextStep = screen
      .getByRole('heading', { name: 'Next step (optional)' })
      .closest('section')!;
    expect(nextStep.querySelector('.framework-tag')?.textContent).toBe('ASD Essentials');
  });

  it('shows Part 1 and Part 2 on both pages, marking the current part', async () => {
    saveAnswers(allYes());
    render(<App />);
    await go('/results');
    let parts = screen.getByRole('navigation', { name: 'Parts of your result' });
    expect(parts).toHaveTextContent('Part 1: your Essential Eight result (you are here)');
    expect(within(parts).getByRole('link', { name: /Part 2 \(optional\)/ })).toHaveAttribute(
      'href',
      '#/transition',
    );

    await go('/transition');
    parts = screen.getByRole('navigation', { name: 'Parts of your result' });
    expect(parts).toHaveTextContent(
      'Part 2 (optional): how this carries into ASD Essentials (you are here)',
    );
    expect(within(parts).getByRole('link', { name: /Part 1/ })).toHaveAttribute(
      'href',
      '#/results',
    );
  });

  it('still names ASD Essentials in every transition heading', async () => {
    saveAnswers(allYes(), 3);
    render(<App />);
    await go('/transition');
    for (const heading of screen.getAllByRole('heading')) {
      expect(heading.textContent).toContain('ASD Essentials');
    }
  });
});
