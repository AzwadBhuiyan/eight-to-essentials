import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { e8Requirements } from '../data/index.ts';
import type { Strategy } from '../data/types.ts';
import type { Answer } from '../lib/types.ts';
import { QuestionCard } from './QuestionCard.tsx';

const byId = (id: string) => e8Requirements.find((r) => r.id === id)!;

/** Renders a QuestionCard that keeps its own answer, like the real wizard does. */
function Harness({ id, strategy }: { id: string; strategy: Strategy }) {
  const [answer, setAnswer] = useState<Answer | undefined>();
  return (
    <QuestionCard requirement={byId(id)} answer={answer} strategy={strategy} onChange={setAnswer} />
  );
}

describe('QuestionCard', () => {
  it('shows the question, its ID and its source', () => {
    render(<Harness id="ISM-0843" strategy="Application control" />);
    expect(screen.getByRole('group', { name: byId('ISM-0843').plainText })).toBeInTheDocument();
    expect(screen.getByText('ISM-0843')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Essential Eight maturity model/ })).toHaveAttribute(
      'href',
      'https://www.cyber.gov.au/publication/essential-eight-maturity-model',
    );
  });

  it('offers "Does not apply" only where the data allows it', () => {
    const { unmount } = render(<Harness id="ISM-0843" strategy="Application control" />);
    expect(screen.queryByRole('radio', { name: 'Does not apply' })).not.toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: 'Exception with compensating control' }),
    ).toBeInTheDocument();
    unmount();
    render(<Harness id="ISM-1671" strategy="Restrict Microsoft Office macros" />);
    expect(screen.getByRole('radio', { name: 'Does not apply' })).toBeInTheDocument();
  });

  it('asks for a reason when "Does not apply" is chosen', async () => {
    const user = userEvent.setup();
    render(<Harness id="ISM-1671" strategy="Restrict Microsoft Office macros" />);
    await user.click(screen.getByRole('radio', { name: 'Does not apply' }));
    expect(screen.getByText('Give a reason why this does not apply.')).toBeInTheDocument();
    await user.type(
      screen.getByLabelText('Why does this not apply? (required)'),
      'Microsoft Office is not used',
    );
    expect(screen.queryByText('Give a reason why this does not apply.')).not.toBeInTheDocument();
  });

  it('asks for every exception field until each is filled in', async () => {
    const user = userEvent.setup();
    render(<Harness id="ISM-0843" strategy="Application control" />);
    await user.click(screen.getByRole('radio', { name: 'Exception with compensating control' }));
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Describe the compensating control.');
    expect(status).toHaveTextContent('Say who approved the exception.');

    await user.type(screen.getByLabelText('Reason for the exception (required)'), 'Legacy app');
    await user.type(screen.getByLabelText('Compensating control (required)'), 'Isolated network');
    await user.type(screen.getByLabelText('Approved by (required)'), 'CEO');
    await user.type(screen.getByLabelText('Review date (required)'), '2027-03-31');
    expect(screen.queryByText(/Still needed/)).not.toBeInTheDocument();
  });

  it('names the other strategies a shared requirement counts for', () => {
    render(<Harness id="ISM-1815" strategy="Multi-factor authentication" />);
    expect(
      screen.getByText(
        /also counts for Restrict administrative privileges, Application control, User application hardening/,
      ),
    ).toBeInTheDocument();
  });

  it('shows helper text where the data has it', () => {
    render(<Harness id="ISM-1701" strategy="Patch operating systems" />);
    expect(
      screen.getByText(
        'Your office router or firewall usually counts as an internet-facing network device.',
      ),
    ).toBeInTheDocument();
  });
});
