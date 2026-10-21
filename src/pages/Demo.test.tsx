import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App.tsx';
import { EMPTY_STATE } from '../lib/assessment.ts';
import { buildExport } from '../lib/importExport.ts';
import { STORAGE_KEY } from '../lib/storage.ts';

async function go(path: string) {
  await act(async () => {
    window.location.hash = path;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

const DEMO_ROUTES = [
  '/example',
  '/example/transition',
  ...Array.from({ length: 8 }, (_, i) => `/example/assessment/${i + 1}`),
];

/** The user's own saved answers: Application control on workstations answered "Partly". */
function saveOwnAnswers(): string {
  const saved = JSON.stringify(
    buildExport(
      { ...EMPTY_STATE, answers: { 'ISM-0843': { value: 'partly' } } },
      new Date('2026-10-21T00:00:00Z'),
    ),
  );
  window.localStorage.setItem(STORAGE_KEY, saved);
  return saved;
}

describe('demo screens', () => {
  it.each(DEMO_ROUTES)('shows "Fictional demo company" and Exit demo on %s', async (route) => {
    render(<App />);
    await go(route);
    const banner = screen.getByRole('note', { name: 'Fictional demo company' });
    expect(banner).toHaveTextContent('Fictional demo company: Swan River Analytics.');
    expect(within(banner).getByRole('link', { name: 'Exit demo' })).toBeInTheDocument();
  });

  it('shows the demo results with its target and levels', async () => {
    render(<App />);
    await go('/example');
    expect(
      screen.getByText('Headline: Maturity Level Zero (your target: Maturity Level Two).'),
    ).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /Patch operating systems/ })).toHaveTextContent(
      'Maturity Level Two (your target)',
    );
    expect(screen.getByRole('row', { name: /Application control/ })).toHaveTextContent(
      'Maturity Level Zero',
    );
    expect(document.title).toBe('Demo: results · Eight to Essentials');
  });

  it('keeps links inside the demo', async () => {
    render(<App />);
    await go('/example');
    expect(
      screen.getByRole('link', { name: 'See how this carries into ASD Essentials' }),
    ).toHaveAttribute('href', '#/example/transition');
    expect(screen.getByRole('link', { name: "See the demo company's answers" })).toHaveAttribute(
      'href',
      '#/example/assessment/1',
    );
  });

  it('shows a meaningful ASD Essentials transition view for the demo', async () => {
    render(<App />);
    await go('/example/transition');
    expect(screen.getAllByText(/Partial coverage in /).length).toBeGreaterThan(0);
    expect(screen.getAllByText('May contribute').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Gap').length).toBeGreaterThan(0);
  });

  it('shows the demo answers read-only, without save, import or clear controls', async () => {
    render(<App />);
    await go('/example/assessment/5'); // Application control
    const question = screen.getByRole('group', {
      name: /Application control is in place on workstations/,
    });
    const no = within(question).getByRole('radio', { name: 'No' });
    expect(no).toBeChecked();
    expect(no).toBeDisabled();
    expect(within(question).queryByRole('button', { name: 'Skip for now' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Your data' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Clear my data' })).toBeNull();
  });

  it('labels the demo results CSV as fictional', async () => {
    const user = userEvent.setup();
    const blobs: Blob[] = [];
    const names: string[] = [];
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = (blob: Blob) => (blobs.push(blob), 'blob:test');
    URL.revokeObjectURL = () => {};
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      names.push(this.download);
    });
    try {
      render(<App />);
      await go('/example');
      await user.click(screen.getByRole('button', { name: 'Export results (CSV)' }));
      const firstRow = (await blobs[0]!.text()).split('\r\n')[1]!;
      expect(firstRow).toContain(
        'FICTIONAL DEMO COMPANY. Eight to Essentials results for Swan River Analytics.',
      );
      expect(names[0]).toMatch(/^eight-to-essentials-demo-results-/);
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      click.mockRestore();
    }
  });
});

describe("the demo never touches the user's own answers", () => {
  it('leaves saved answers byte-for-byte unchanged after visiting every demo screen', async () => {
    const user = userEvent.setup();
    const saved = saveOwnAnswers();
    render(<App />);
    for (const route of DEMO_ROUTES) await go(route);
    // Try to change a demo answer: the input is disabled, so nothing happens.
    await go('/example/assessment/5');
    const question = screen.getByRole('group', {
      name: /Application control is in place on workstations/,
    });
    await user.click(
      within(question).getByRole('radio', { name: 'Yes, and we can show evidence' }),
    );
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(saved);
  });

  it('never writes anything to storage when the user has not turned saving on', async () => {
    render(<App />);
    for (const route of DEMO_ROUTES) await go(route);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(window.localStorage.length).toBe(0);
  });

  it("returns to the user's own answers on Exit demo", async () => {
    const user = userEvent.setup();
    saveOwnAnswers();
    render(<App />);
    await go('/example/assessment/5');
    const exit = screen.getByRole('link', { name: 'Exit demo' });
    expect(exit).toHaveAttribute('href', '#/results'); // the user has their own answers
    await user.click(exit);
    await go('/assessment/5');
    expect(screen.queryByRole('note', { name: 'Fictional demo company' })).toBeNull();
    const question = screen.getByRole('group', {
      name: /Application control is in place on workstations/,
    });
    // The user's own answer ("Partly"), not the demo's ("No").
    expect(within(question).getByRole('radio', { name: 'Partly' })).toBeChecked();
    expect(within(question).getByRole('radio', { name: 'Partly' })).toBeEnabled();
  });

  it('keeps unsaved answers in memory separate from the demo', async () => {
    const user = userEvent.setup();
    render(<App />);
    await go('/assessment/5');
    const own = screen.getByRole('group', {
      name: /Application control is in place on workstations/,
    });
    await user.click(within(own).getByRole('radio', { name: 'Yes, and we can show evidence' }));

    await go('/example/assessment/5');
    const demo = screen.getByRole('group', {
      name: /Application control is in place on workstations/,
    });
    expect(within(demo).getByRole('radio', { name: 'No' })).toBeChecked();

    await go('/assessment/5');
    const back = screen.getByRole('group', {
      name: /Application control is in place on workstations/,
    });
    expect(
      within(back).getByRole('radio', { name: 'Yes, and we can show evidence' }),
    ).toBeChecked();
    expect(window.localStorage.length).toBe(0);
  });

  it('sends Exit demo to the home page when the user has no answers yet', async () => {
    render(<App />);
    await go('/example');
    expect(screen.getByRole('link', { name: 'Exit demo' })).toHaveAttribute('href', '#/');
  });
});
