/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App.tsx';
import { author } from '../config/author.ts';
import { e8Requirements, meta } from '../data/index.ts';
import { EMPTY_STATE } from '../lib/assessment.ts';
import { effectiveAnswers } from '../lib/effective.ts';
import { buildExport } from '../lib/importExport.ts';
import { headlineText, strategyResultText } from '../lib/resultsText.ts';
import { scoreAll } from '../lib/scoring.ts';
import {
  ABOUT_SKILLS,
  ABOUT_WHY,
  SMALL_BUSINESS_URL,
  printFooterText,
  reportDate,
} from '../lib/siteText.ts';
import { STORAGE_KEY } from '../lib/storage.ts';
import { DISCLAIMER } from '../lib/text.ts';
import { allYes, validException } from '../lib/test-helpers.ts';
import type { Answers } from '../lib/types.ts';

async function go(path: string) {
  await act(async () => {
    window.location.hash = path;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

const ownAnswers: Answers = allYes({
  'ISM-0843': { value: 'no' },
  'ISM-1511': { value: 'not-sure' },
  'ISM-1504': validException,
});

function saveOwn(answers: Answers = ownAnswers) {
  const state = {
    ...EMPTY_STATE,
    context: {
      ...EMPTY_STATE.context,
      organisationName: 'Example Pty Ltd',
      e8ReportingRequired: 'yes' as const,
      targetLevel: 1 as const,
    },
    answers,
  };
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(buildExport(state, new Date('2026-10-22T00:00:00Z'))),
  );
  return state;
}

describe('printable report', () => {
  it('has a cover with organisation, date, target and "not an official assessment"', async () => {
    saveOwn();
    render(<App />);
    await go('/report');
    const cover = screen
      .getByRole('heading', { level: 1, name: 'Essential Eight self-assessment report' })
      .closest('section')!;
    expect(cover).toHaveTextContent('Example Pty Ltd');
    expect(cover).toHaveTextContent(reportDate(new Date()));
    expect(cover).toHaveTextContent('Maturity Level One');
    expect(cover).toHaveTextContent('Self-assessment, not an official assessment.');
    expect(cover).toHaveTextContent(DISCLAIMER);
  });

  it('uses the same wording as the results page for the headline and strategies', async () => {
    const state = saveOwn();
    const e8 = scoreAll(e8Requirements, effectiveAnswers(state, e8Requirements).answers, 1);
    render(<App />);
    await go('/report');
    expect(screen.getByText(headlineText(e8))).toBeInTheDocument();
    const table = screen.getByRole('table', { name: /Essential Eight maturity by strategy/ });
    for (const s of e8.strategies) {
      expect(within(table).getByRole('row', { name: new RegExp(s.strategy) })).toHaveTextContent(
        strategyResultText(s),
      );
    }
  });

  it('has Part 1 with the chart, every action, evidence and exceptions, labelled Essential Eight', async () => {
    saveOwn();
    render(<App />);
    await go('/report');
    const part1 = screen
      .getByRole('heading', { level: 2, name: 'Part 1: your Essential Eight result' })
      .closest('section')!;
    expect(part1.querySelector('.framework-tag')?.textContent).toBe('Essential Eight');
    expect(await within(part1).findByRole('img', { name: /Radar chart/ })).toBeInTheDocument();
    expect(
      within(part1).getByRole('heading', {
        level: 3,
        name: 'Actions to lift your Essential Eight maturity',
      }),
    ).toBeInTheDocument();
    expect(within(part1).queryByRole('button', { name: /Show all/ })).toBeNull();
    expect(
      within(part1).getByRole('heading', { level: 3, name: 'Essential Eight: evidence to find' }),
    ).toBeInTheDocument();
    expect(
      within(part1).getByRole('heading', {
        level: 3,
        name: 'Essential Eight: exceptions to review',
      }),
    ).toBeInTheDocument();
    expect(part1).toHaveTextContent('ISM-1511');
  });

  it('has an optional Part 2, labelled ASD Essentials, that can be left out', async () => {
    const user = userEvent.setup();
    saveOwn();
    render(<App />);
    await go('/report');
    const part2 = screen
      .getByRole('heading', {
        level: 2,
        name: 'Part 2 (optional): how this carries into ASD Essentials',
      })
      .closest('section')!;
    expect(part2.querySelector('.framework-tag')?.textContent).toBe('ASD Essentials');
    for (const caption of part2.querySelectorAll('caption')) {
      expect(caption.textContent).toMatch(/^ASD Essentials domain: /);
    }
    await user.click(screen.getByRole('checkbox', { name: /Include Part 2/ }));
    expect(screen.queryByRole('heading', { name: /Part 2/ })).toBeNull();
  });

  it('ends with method and sources, linking every source document', async () => {
    saveOwn();
    render(<App />);
    await go('/report');
    const method = screen
      .getByRole('heading', { level: 2, name: 'Method and sources' })
      .closest('section')!;
    for (const d of meta.documents) {
      expect(within(method).getByRole('link', { name: d.name })).toHaveAttribute('href', d.url);
    }
    expect(method).toHaveTextContent(meta.dataCheckedOn);
    expect(method).toHaveTextContent('Not affiliated with or endorsed by ASD or the ACSC');
  });

  it('has the author footer for every printed page', async () => {
    saveOwn();
    render(<App />);
    await go('/report');
    const footer = document.querySelector('.print-footer')!;
    expect(footer.textContent).toBe(printFooterText(author.name, false));
    expect(footer.textContent).toBe(
      `Created with Eight to Essentials by ${author.name} · Self-assessment, not an official assessment`,
    );
  });

  it('says "Fictional demo company" on the demo report cover and footer', async () => {
    render(<App />);
    await go('/example/report');
    const cover = screen
      .getByRole('heading', { level: 1, name: 'Essential Eight self-assessment report' })
      .closest('section')!;
    expect(cover).toHaveTextContent('Fictional demo company');
    expect(cover).toHaveTextContent('Swan River Analytics');
    expect(cover).toHaveTextContent('Maturity Level Two');
    expect(document.querySelector('.print-footer')!.textContent).toMatch(
      /^Fictional demo company · Created with Eight to Essentials by /,
    );
  });

  it('prints from a button, and is linked from the results page', async () => {
    const user = userEvent.setup();
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    saveOwn();
    render(<App />);
    await go('/results');
    expect(screen.getByRole('link', { name: 'Printable report (PDF)' })).toHaveAttribute(
      'href',
      '#/report',
    );
    await go('/report');
    await user.click(screen.getByRole('button', { name: 'Print or save as PDF' }));
    expect(print).toHaveBeenCalledOnce();
    print.mockRestore();
  });
});

describe('print stylesheet', () => {
  // Tests run from the project folder, so the stylesheet is read straight from disk.
  const css = readFileSync('src/styles/global.css', 'utf8');
  const printBlock = css.slice(css.indexOf('@media print'));

  it('repeats the footer on every printed page and hides it on screen', () => {
    expect(css).toMatch(/\.print-footer\s*\{\s*display:\s*none;/);
    expect(printBlock).toMatch(
      /\.print-footer\s*\{[^}]*display:\s*block;[^}]*position:\s*fixed;[^}]*bottom:\s*0;/,
    );
  });

  it('hides navigation and screen-only controls, and prints in the light palette', () => {
    for (const selector of [
      '.site-header',
      '.site-footer',
      '.no-print',
      '.demo-banner',
      '.button',
    ]) {
      expect(printBlock).toContain(selector);
    }
    expect(printBlock).toContain('color-scheme: light');
    expect(printBlock).toMatch(/\.report__part\s*\{\s*break-before:\s*page;/);
  });
});

describe('About page', () => {
  it('says who built it and why, the skills involved, and LinkedIn as the contact', async () => {
    render(<App />);
    await go('/about');
    expect(
      screen.getByRole('heading', { level: 1, name: 'About Eight to Essentials' }),
    ).toBeInTheDocument();
    expect(screen.getByText(ABOUT_WHY)).toBeInTheDocument();
    expect(document.body).toHaveTextContent(author.name);
    for (const skill of ABOUT_SKILLS) expect(screen.getByText(skill)).toBeInTheDocument();
    const contact = screen.getByRole('heading', { name: 'Contact' }).closest('section')!;
    expect(within(contact).getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      author.linkedInUrl,
    );
  });

  it('has no email address or phone number anywhere', async () => {
    render(<App />);
    await go('/about');
    const hrefs = Array.from(document.querySelectorAll('a')).map(
      (a) => a.getAttribute('href') ?? '',
    );
    expect(hrefs.some((h) => h.startsWith('mailto:') || h.startsWith('tel:'))).toBe(false);
    expect(document.body.textContent).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
    expect(document.body.textContent).not.toMatch(/\b(\+?61|0)[2-478](\s?\d){8}\b/);
  });
});

describe('Method and sources page', () => {
  async function openMethod() {
    render(<App />);
    await go('/method');
    return document.body;
  }

  it('explains the scoring rules, target level and adaptive questions', async () => {
    const body = await openMethod();
    expect(body).toHaveTextContent(
      'Only requirements up to your target are asked (46, 87 or 126 questions)',
    );
    expect(body).toHaveTextContent('every requirement at that level and every lower level is met');
    expect(body).toHaveTextContent('"Partly", "No" and "Not sure" never count as met');
    expect(body).toHaveTextContent('its higher questions become optional');
  });

  it('covers "Does not apply", exceptions, the transition mapping and the roll-up', async () => {
    const body = await openMethod();
    expect(body).toHaveTextContent(
      'An exception needs a reason, a compensating control, an approver and a review date',
    );
    expect(body).toHaveTextContent('Partial coverage in [domain]');
    expect(body).toHaveTextContent("The weakest mapped action sets each principle's finding");
    expect(body).toHaveTextContent('at most "partially addressed"');
    expect(body).toHaveTextContent('never gives an ASD Essentials rating');
  });

  it("labels the author's own rules as such", async () => {
    await openMethod();
    // Not-applicable choices, adaptive questions, local IDs, ordering, effort, multiple strategies, roll-up.
    expect(screen.getAllByText('Our rule').length).toBeGreaterThanOrEqual(7);
    const rollUp = screen.getByText('Roll-up to principles.').closest('li')!;
    expect(within(rollUp).getByText('Our rule')).toBeInTheDocument();
  });

  it('explains the PRO-09.2 inconsistency and how it was handled', async () => {
    const body = await openMethod();
    const section = screen
      .getByRole('heading', { name: "Where ASD's documents disagree" })
      .closest('section')!;
    expect(section).toHaveTextContent('PRO-09.2');
    expect(section).toHaveTextContent('Table 8, page 18');
    expect(section).toHaveTextContent('drop that row');
    expect(body).toHaveTextContent('Limitations');
  });

  it('notes who ASD Essentials is for, with a link to small business guidance', async () => {
    await openMethod();
    expect(screen.getByRole('link', { name: 'guidance for small businesses' })).toHaveAttribute(
      'href',
      SMALL_BUSINESS_URL,
    );
    expect(document.body).toHaveTextContent(
      'written mainly for Commonwealth entities, critical infrastructure owners and operators, and large organisations',
    );
  });

  it('lists every source, the licence, framework versions, the data-checked date and non-affiliation', async () => {
    await openMethod();
    const sources = screen.getByRole('heading', { name: 'Sources' }).closest('section')!;
    for (const d of meta.documents) {
      expect(within(sources).getByRole('link', { name: d.name })).toHaveAttribute('href', d.url);
    }
    expect(within(sources).getByRole('link', { name: meta.licence.name })).toHaveAttribute(
      'href',
      meta.licence.url,
    );
    expect(sources).toHaveTextContent('Not affiliated with or endorsed by');
    const footer = document.querySelector('.method-footer')!;
    expect(footer).toHaveTextContent(
      `Data checked against the official documents on ${meta.dataCheckedOn}`,
    );
    for (const f of meta.frameworks) expect(footer).toHaveTextContent(f.version);
  });
});

describe('disclaimer, attribution and author credit on every main page', () => {
  it.each(['/', '/results', '/transition', '/report', '/about', '/method'])('%s', async (path) => {
    saveOwn();
    render(<App />);
    await go(path);
    expect(document.body).toHaveTextContent(DISCLAIMER);
    expect(document.body).toHaveTextContent(meta.licence.attribution);
    const credit = screen.getAllByRole('link', { name: author.name });
    expect(credit[0]).toHaveAttribute('href', author.linkedInUrl);
  });
});
