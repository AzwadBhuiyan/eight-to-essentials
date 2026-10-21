// Adds DOM matchers such as toBeInTheDocument() to Vitest's expect.
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Vitest globals are off, so Testing Library cannot clean up automatically.
// Storage and the URL hash are reset too, so tests cannot affect each other.
afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.location.hash = '';
});

// jsdom cannot draw on a canvas, so Chart.js cannot run in tests. The chart is replaced with a
// stand-in that keeps its text alternative; chartDescription has its own tests.
vi.mock('../components/StrategyRadarChart.tsx', async () => {
  const { chartDescription } = await import('../components/chartDescription.ts');
  return {
    default: ({ e8 }: { e8: Parameters<typeof chartDescription>[0] }) => (
      <div role="img" aria-label={chartDescription(e8)} />
    ),
  };
});

// Load the lazily loaded pages once, so tests can check a page as soon as they navigate to it.
beforeAll(async () => {
  const { preloadPages } = await import('../pages/lazyPages.tsx');
  await preloadPages();
});
