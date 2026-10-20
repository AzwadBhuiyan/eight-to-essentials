import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { e8Requirements, frameworkData, productGroups } from '../data/index.ts';
import { exceptionsToReview } from '../lib/evidence.ts';
import { buildActionList } from '../lib/prioritise.ts';
import { scoreAll } from '../lib/scoring.ts';
import { SUPERSEDED_TARGET_ADVICE } from '../lib/text.ts';
import { allYes, no, validException } from '../lib/test-helpers.ts';
import type { Answers } from '../lib/types.ts';
import { ActionListSection } from './ActionListSection.tsx';
import { ExceptionsSection } from './ExceptionsSection.tsx';
import { chartDescription } from './chartDescription.ts';

// Seven unmet ML1 requirements, so the list has more than five items.
const seven = ['ISM-1807', 'ISM-1808', 'ISM-1698', 'ISM-1504', 'ISM-0843', 'ISM-1511', 'ISM-1671'];
const answers: Answers = allYes(Object.fromEntries(seven.map((id) => [id, no])));
const e8 = scoreAll(e8Requirements, answers, 1);

describe('action list section', () => {
  it('shows the top five, then all of them on request', async () => {
    const user = userEvent.setup();
    const list = buildActionList(frameworkData, answers, { e8ReportingRequired: 'yes' }, e8);
    render(<ActionListSection list={list} />);
    expect(
      screen.getByRole('heading', { name: 'Actions to lift your Essential Eight maturity' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    const button = screen.getByRole('button', { name: 'Show all 7 actions' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await user.click(button);
    expect(screen.getAllByRole('listitem')).toHaveLength(7);
    expect(screen.getByRole('button', { name: 'Show the top 5 only' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it("shows each action's next step, effort estimate and related principles", () => {
    const list = buildActionList(frameworkData, answers, { e8ReportingRequired: 'yes' }, e8);
    render(<ActionListSection list={list} />);
    const first = screen.getAllByRole('listitem')[0]!;
    expect(first).toHaveTextContent('Next step:');
    expect(first).toHaveTextContent('Effort (our estimate):');
    expect(first).toHaveTextContent('Related ASD Essentials principles:');
  });

  it("is framed as risk reduction, with ASD's advice, when E8 reporting is not required", () => {
    const list = buildActionList(frameworkData, answers, { e8ReportingRequired: 'no' }, e8);
    render(<ActionListSection list={list} />);
    expect(screen.getByRole('heading', { name: 'Risk-reduction actions' })).toBeInTheDocument();
    expect(screen.getByText(SUPERSEDED_TARGET_ADVICE)).toBeInTheDocument();
  });

  it('says so when there is nothing to do', () => {
    const allMet = scoreAll(e8Requirements, allYes(), 1);
    render(
      <ActionListSection
        list={buildActionList(frameworkData, allYes(), { e8ReportingRequired: 'yes' }, allMet)}
      />,
    );
    expect(
      screen.getByText(/No actions: every answered requirement up to your target is met/),
    ).toBeInTheDocument();
  });
});

describe('exceptions section', () => {
  it('groups product-group answers and flags overdue reviews', () => {
    const office = e8Requirements.filter(
      (r) => r.naGroup === 'microsoft-office' && r.levels.includes(1),
    );
    const fromGroup = Object.fromEntries(office.map((r) => [r.id, 'microsoft-office']));
    const withGroup: Answers = {
      ...allYes(
        Object.fromEntries(
          office.map((r) => [r.id, { value: 'not-applicable', reason: 'Google Workspace' }]),
        ),
      ),
      'ISM-0843': { ...validException, reviewDate: '2026-01-01' },
    };
    const items = exceptionsToReview(e8Requirements, withGroup, '2026-10-20', fromGroup);
    render(<ExceptionsSection items={items} productGroups={productGroups} />);

    const group = screen.getByText("We don't use Microsoft Office").closest('li')!;
    expect(group).toHaveTextContent(`"Does not apply" for ${office.length} requirements`);
    expect(within(group).getByText('Google Workspace')).toBeInTheDocument();

    const exception = screen
      .getByText(/Application control is in place on workstations/)
      .closest('li')!;
    expect(exception).toHaveTextContent('Review overdue');
    expect(exception).toHaveTextContent(validException.compensatingControl);
    expect(screen.getByText(/ASD expects exceptions to be kept to a minimum/)).toBeInTheDocument();
  });
});

describe('chart text alternative', () => {
  it('describes every strategy and the target', () => {
    const text = chartDescription(scoreAll(e8Requirements, { 'ISM-0843': no }, 1));
    expect(text).toContain('against a target of Maturity Level One');
    expect(text).toContain('Application control: Maturity Level Zero');
    expect(text).toContain('Patch applications: incomplete');
  });
});
