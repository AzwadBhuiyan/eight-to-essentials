import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.tsx';
import { author } from './config/author.ts';
import { CLOUD_CHAPTER_NOTICE, DISCLAIMER } from './lib/text.ts';
import { STORAGE_KEY } from './lib/storage.ts';
import { buildExport } from './lib/importExport.ts';
import { EMPTY_STATE } from './lib/assessment.ts';

/** Moves to a route and lets the app react to the hashchange event. */
async function go(path: string) {
  await act(async () => {
    window.location.hash = path;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

describe('App shell', () => {
  it('shows the home page with the app name and disclaimer', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Eight to Essentials' }),
    ).toBeInTheDocument();
    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument();
  });

  it('credits the author with a LinkedIn link', () => {
    render(<App />);
    const link = screen.getByRole('link', { name: author.name });
    expect(link).toHaveAttribute('href', author.linkedInUrl);
  });

  it('shows "Page not found" for an unknown route', async () => {
    render(<App />);
    await go('/nowhere');
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    await go('/assessment/9');
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
  });
});

describe('context questions', () => {
  it('shows the cloud chapter notice only for SaaS and PaaS', async () => {
    const user = userEvent.setup();
    render(<App />);
    await go('/context');
    expect(screen.queryByText(CLOUD_CHAPTER_NOTICE)).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Almost entirely SaaS and PaaS' }));
    expect(screen.getByText(CLOUD_CHAPTER_NOTICE)).toBeInTheDocument();
  });
});

describe('assessment wizard', () => {
  it('shows one strategy per step with back and next links', async () => {
    render(<App />);
    await go('/assessment/1');
    expect(screen.getByRole('heading', { level: 1, name: 'Patch applications' })).toHaveFocus();
    expect(screen.getByRole('link', { name: 'Next: Patch operating systems' })).toHaveAttribute(
      'href',
      '#/assessment/2',
    );
    await go('/assessment/8');
    expect(screen.getByRole('link', { name: 'See results' })).toHaveAttribute('href', '#/results');
  });

  it('asks a shared control once and shows the answer under the other strategies', async () => {
    const user = userEvent.setup();
    render(<App />);
    await go('/assessment/3'); // Multi-factor authentication asks ISM-1815.
    const question = screen.getByRole('group', { name: /Event logs are protected/ });
    await user.click(within(question).getByRole('radio', { name: 'No' }));

    await go('/assessment/4'); // Restrict administrative privileges shows a note instead.
    expect(screen.queryByRole('group', { name: /Event logs are protected/ })).toBeNull();
    const note = screen.getByText(/Event logs are protected/).closest('div')!;
    expect(note).toHaveTextContent('Shared requirement, asked under Multi-factor authentication');
    expect(note).toHaveTextContent('Your answer: No');
  });

  it('updates the progress count as questions are answered', async () => {
    const user = userEvent.setup();
    render(<App />);
    await go('/assessment/5'); // Application control
    expect(screen.getByText(/0 of 126 questions answered overall/)).toBeInTheDocument();
    const question = screen.getByRole('group', {
      name: /Application control is in place on workstations/,
    });
    await user.click(
      within(question).getByRole('radio', { name: 'Yes, and we can show evidence' }),
    );
    expect(screen.getByText(/1 of 126 questions answered overall/)).toBeInTheDocument();
  });
});

describe('saving, clearing and importing', () => {
  it('saves nothing until saving is turned on, then saves, then clears', async () => {
    const user = userEvent.setup();
    render(<App />);
    await go('/assessment/5');
    const question = screen.getByRole('group', {
      name: /Application control is in place on workstations/,
    });
    await user.click(within(question).getByRole('radio', { name: 'No' }));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();

    await user.click(screen.getByRole('checkbox', { name: 'Save my progress on this device' }));
    expect(screen.getByText('Saved on this device.')).toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEY)).toContain('"ISM-0843"');

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await user.click(screen.getByRole('button', { name: 'Clear my data' }));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(
      screen.getByRole('checkbox', { name: 'Save my progress on this device' }),
    ).not.toBeChecked();
    expect(within(question).getByRole('radio', { name: 'No' })).not.toBeChecked();
    vi.restoreAllMocks();
  });

  it('removes saved data when saving is turned off', async () => {
    const user = userEvent.setup();
    render(<App />);
    await go('/assessment/1');
    const checkbox = screen.getByRole('checkbox', { name: 'Save my progress on this device' });
    await user.click(checkbox);
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    await user.click(checkbox);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('restores saved progress when the app opens', async () => {
    const saved = buildExport(
      { ...EMPTY_STATE, answers: { 'ISM-0843': { value: 'partly' } } },
      new Date('2026-10-20T00:00:00Z'),
    );
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    render(<App />);
    await go('/assessment/5');
    const question = screen.getByRole('group', {
      name: /Application control is in place on workstations/,
    });
    expect(within(question).getByRole('radio', { name: 'Partly' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Save my progress on this device' })).toBeChecked();
  });

  it('imports a valid answers file', async () => {
    const user = userEvent.setup();
    render(<App />);
    await go('/assessment/5');
    const file = new File(
      [
        JSON.stringify(
          buildExport({ ...EMPTY_STATE, answers: { 'ISM-0843': { value: 'yes' } } }, new Date()),
        ),
      ],
      'answers.json',
      { type: 'application/json' },
    );
    await user.upload(screen.getByLabelText('Import answers (JSON)'), file);
    expect(await screen.findByText('Imported 1 answers.')).toBeInTheDocument();
    const question = screen.getByRole('group', {
      name: /Application control is in place on workstations/,
    });
    expect(
      within(question).getByRole('radio', { name: 'Yes, and we can show evidence' }),
    ).toBeChecked();
  });

  it('rejects an invalid answers file and explains why', async () => {
    const user = userEvent.setup();
    render(<App />);
    await go('/assessment/5');
    const file = new File([JSON.stringify({ format: 'something', extra: 1 })], 'bad.json', {
      type: 'application/json',
    });
    await user.upload(screen.getByLabelText('Import answers (JSON)'), file);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Import failed: this is not a valid Eight to Essentials answers file.',
    );
  });

  it('rejects a file over 1 MB without reading it', async () => {
    const user = userEvent.setup();
    render(<App />);
    await go('/assessment/5');
    const big = new File(['x'.repeat(1024 * 1024 + 1)], 'big.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText('Import answers (JSON)'), big);
    expect(await screen.findByRole('alert')).toHaveTextContent('larger than 1 MB');
  });
});
