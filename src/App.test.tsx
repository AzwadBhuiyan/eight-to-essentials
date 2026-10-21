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
  it('shows the home page with its headline and disclaimer', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Find your Essential Eight level, and see what it means for ASD Essentials.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Eight to Essentials' })).toHaveAttribute('href', '#/');
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
    await go('/assessment/1'); // Patch applications asks ISM-1807 (shared with Patch operating systems).
    const question = screen.getByRole('group', { name: /An automated tool discovers/ });
    await user.click(within(question).getByRole('radio', { name: 'No' }));

    await go('/assessment/2'); // Patch operating systems shows a note instead.
    expect(screen.queryByRole('group', { name: /An automated tool discovers/ })).toBeNull();
    const note = screen.getByText(/An automated tool discovers/).closest('div')!;
    expect(note).toHaveTextContent('Shared requirement, asked under Patch applications');
    expect(note).toHaveTextContent('Your answer: No');
  });

  it('updates the progress count as questions are answered', async () => {
    const user = userEvent.setup();
    render(<App />);
    await go('/assessment/5'); // Application control
    expect(screen.getByText(/0 of 46 questions answered/)).toBeInTheDocument();
    const question = screen.getByRole('group', {
      name: /Application control is in place on workstations/,
    });
    await user.click(
      within(question).getByRole('radio', { name: 'Yes, and we can show evidence' }),
    );
    expect(screen.getByText(/1 of 46 questions answered/)).toBeInTheDocument();
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

describe('target level and product groups (D29, D31)', () => {
  it('asks for a target, with the hint, its source and the question counts', async () => {
    render(<App />);
    await go('/context');
    const target = screen.getByRole('group', { name: 'Which maturity level are you aiming for?' });
    expect(target).toHaveTextContent(
      'Commonwealth entities have been required to reach Maturity Level Two. If a contract, customer or insurer asks for a level, choose that one.',
    );
    expect(
      within(target).getByRole('link', { name: /Transitioning from the Essential Eight, page 9/ }),
    ).toBeInTheDocument();
    expect(
      within(target).getByRole('radio', { name: 'Maturity Level One (46 questions at most)' }),
    ).toBeChecked();
    expect(
      within(target).getByRole('radio', { name: 'Maturity Level Two (87 questions at most)' }),
    ).toBeInTheDocument();
    expect(
      within(target).getByRole('radio', { name: 'Maturity Level Three (126 questions at most)' }),
    ).toBeInTheDocument();
  });

  it('shows the router and firewall check on the internet-facing servers group', async () => {
    render(<App />);
    await go('/context');
    const checkbox = screen.getByRole('checkbox', {
      name: 'We have no internet-facing servers or internet-facing network devices',
    });
    expect(checkbox).toHaveAccessibleDescription(
      /Your office router or firewall usually counts as an internet-facing network device/,
    );
  });

  it('answers Microsoft Office questions from one group answer, with a reason', async () => {
    const user = userEvent.setup();
    render(<App />);
    await go('/context');
    await user.click(screen.getByRole('checkbox', { name: "We don't use Microsoft Office" }));
    expect(
      screen.getByText('Give a reason. Until you do, these questions are not answered.'),
    ).toBeInTheDocument();
    await user.type(
      screen.getByLabelText('Why is this true for your organisation? (required)'),
      'We use Google Workspace',
    );

    await go('/assessment/6'); // Restrict Microsoft Office macros
    const question = screen.getByRole('group', { name: /macros are turned off for users/ });
    expect(within(question).getByRole('radio', { name: 'Does not apply' })).toBeChecked();
    expect(question).toHaveTextContent(`by your answer "We don't use Microsoft Office"`);
    // Overriding one question keeps the group for the others.
    await user.click(within(question).getByRole('radio', { name: 'No' }));
    expect(within(question).getByRole('radio', { name: 'No' })).toBeChecked();
    expect(screen.getByRole('group', { name: /from the internet are blocked/ })).toHaveTextContent(
      'by your answer',
    );
  });
});

describe('skipping and partial results (D30, D32)', () => {
  it('lets a question be skipped and the skip undone', async () => {
    const user = userEvent.setup();
    render(<App />);
    await go('/assessment/5');
    const question = screen.getByRole('group', {
      name: /Application control is in place on workstations/,
    });
    await user.click(within(question).getByRole('button', { name: 'Skip for now' }));
    expect(question).toHaveTextContent('Skipped for now.');
    expect(screen.getByText(/1 skipped/)).toBeInTheDocument();
    await user.click(within(question).getByRole('button', { name: 'Undo skip' }));
    expect(question).not.toHaveTextContent('Skipped for now.');
  });

  it('marks other questions "not needed" once a requirement fails', async () => {
    const user = userEvent.setup();
    render(<App />);
    await go('/assessment/5');
    const first = screen.getByRole('group', {
      name: /Application control is in place on workstations/,
    });
    await user.click(within(first).getByRole('radio', { name: 'No' }));
    expect(screen.getByText(/This strategy is complete: Maturity Level Zero/)).toBeInTheDocument();
    expect(screen.getAllByText(/Not needed for your current level/).length).toBeGreaterThan(0);
  });

  it('offers results at any time and labels an incomplete headline', async () => {
    const user = userEvent.setup();
    render(<App />);
    await go('/assessment/5');
    expect(screen.getByRole('link', { name: 'See results so far' })).toHaveAttribute(
      'href',
      '#/results',
    );
    const first = screen.getByRole('group', {
      name: /Application control is in place on workstations/,
    });
    await user.click(within(first).getByRole('radio', { name: 'No' }));

    await go('/results');
    expect(screen.getByText(/Not final: 1 of 8 strategies complete/)).toBeInTheDocument();
    const row = screen.getByRole('row', { name: /Patch applications/ });
    expect(row).toHaveTextContent(/Incomplete: 9 required questions left/);
    expect(screen.getByRole('row', { name: /Application control/ })).toHaveTextContent(
      'Maturity Level Zero',
    );
  });

  it('shows an upper bound for an incomplete strategy with a failure, never a level', async () => {
    const user = userEvent.setup();
    render(<App />);
    await go('/context');
    await user.click(screen.getByRole('radio', { name: /Maturity Level Two/ }));
    await go('/assessment/5');
    const ml2 = screen.getByRole('group', {
      name: /Application control is in place on internet-facing servers/,
    });
    await user.click(within(ml2).getByRole('radio', { name: 'No' }));

    await go('/results');
    const row = screen.getByRole('row', { name: /Application control/ });
    expect(row).toHaveTextContent('Incomplete');
    expect(row).toHaveTextContent('Cannot be higher than Maturity Level One so far');
  });
});

describe('results page (Phase 5)', () => {
  async function answerApplicationControl(user: ReturnType<typeof userEvent.setup>, value: string) {
    await go('/assessment/5');
    const question = screen.getByRole('group', {
      name: /Application control is in place on workstations/,
    });
    await user.click(within(question).getByRole('radio', { name: value }));
  }

  it('shows the headline, chart, levels table, actions, evidence and exceptions', async () => {
    const user = userEvent.setup();
    render(<App />);
    await answerApplicationControl(user, 'No');
    await go('/results');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Essential Eight results' }),
    ).toBeInTheDocument();
    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument();
    expect(
      await screen.findByRole('img', { name: /Radar chart of Essential Eight maturity/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('table', { name: /Essential Eight maturity by strategy/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Risk-reduction actions' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Essential Eight: evidence to find' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Essential Eight: exceptions to review' }),
    ).toBeInTheDocument();
  });

  it('lists a "Not sure" answer as evidence to find', async () => {
    const user = userEvent.setup();
    render(<App />);
    await answerApplicationControl(user, 'Not sure');
    await go('/results');
    const section = screen
      .getByRole('heading', { name: 'Essential Eight: evidence to find' })
      .closest('section')!;
    expect(section).toHaveTextContent('ISM-0843');
  });

  it('asks the user to start when nothing is answered', async () => {
    render(<App />);
    await go('/results');
    expect(screen.getByText(/You have not answered any questions yet/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Essential Eight: evidence to find' })).toBeNull();
  });

  it('exports the results as CSV', async () => {
    const user = userEvent.setup();
    const created: Blob[] = [];
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = (blob: Blob) => {
      created.push(blob);
      return 'blob:test';
    };
    URL.revokeObjectURL = () => {};
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    try {
      render(<App />);
      await answerApplicationControl(user, 'No');
      await go('/results');
      await user.click(screen.getByRole('button', { name: 'Export results (CSV)' }));
      expect(click).toHaveBeenCalled();
      const text = await created[0]!.text();
      expect(text).toContain('"Section","Strategy","Requirement ID"');
      expect(text).toContain('"ISM-0843"');
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      click.mockRestore();
    }
  });
});
