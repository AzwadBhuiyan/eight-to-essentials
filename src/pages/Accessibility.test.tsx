/**
 * Automated accessibility checks with axe-core on every page.
 *
 * The test environment cannot measure colour contrast, so that one rule is turned off here.
 * Contrast is covered by the computed ratios recorded in the stylesheet and a browser audit.
 */
import { describe, expect, it } from 'vitest';
import { act, render } from '@testing-library/react';
import axe from 'axe-core';
import App from '../App.tsx';
import demo from '../data/demo-swan-river.json';
import { STORAGE_KEY } from '../lib/storage.ts';

const ROUTES = [
  '/',
  '/context',
  '/assessment/1',
  '/assessment/6',
  '/results',
  '/transition',
  '/report',
  '/about',
  '/method',
  '/example',
  '/example/transition',
  '/example/report',
  '/example/assessment/5',
  '/nowhere',
];

async function open(route: string) {
  // Saved answers (the demo's, as sample data) so the results pages have full content.
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demo.assessment));
  render(<App />);
  await act(async () => {
    window.location.hash = route;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

describe('accessibility (axe-core)', () => {
  it.each(ROUTES)(
    '%s has no detectable accessibility problems',
    async (route) => {
      await open(route);
      const result = await axe.run(document.body, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'],
        },
        rules: {
          'color-contrast': { enabled: false }, // not measurable here; see the comment above
          region: { enabled: false }, // the test renders the app without the full HTML page
        },
      });
      const problems = result.violations.map(
        (v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`,
      );
      expect(problems).toEqual([]);
    },
    // The transition page is large, and axe is slow in the test environment.
    30_000,
  );

  it.each(ROUTES)('%s has exactly one h1 and no skipped heading levels', async (route) => {
    await open(route);
    const levels = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((h) =>
      Number(h.tagName[1]),
    );
    expect(levels.filter((l) => l === 1)).toHaveLength(1);
    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]! - levels[i - 1]!, `heading ${i} on ${route}`).toBeLessThanOrEqual(1);
    }
  });

  it('every form control has a label', async () => {
    for (const route of ['/context', '/assessment/1', '/report']) {
      await open(route);
      for (const el of document.querySelectorAll('input, textarea, select')) {
        const id = el.getAttribute('id');
        const labelled =
          el.closest('label') !== null ||
          (id !== null && document.querySelector(`label[for="${id}"]`) !== null) ||
          el.hasAttribute('aria-label') ||
          el.hasAttribute('aria-labelledby');
        expect(labelled, `${route}: ${el.tagName} ${el.getAttribute('name') ?? el.id}`).toBe(true);
      }
    }
  });
});
