import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App.tsx';
import { author } from './config/author.ts';

describe('App shell', () => {
  it('shows the app name', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Eight to Essentials' }),
    ).toBeInTheDocument();
  });

  it('credits the author with a LinkedIn link', () => {
    render(<App />);
    const link = screen.getByRole('link', { name: author.name });
    expect(link).toHaveAttribute('href', author.linkedInUrl);
  });
});
