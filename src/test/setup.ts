// Adds DOM matchers such as toBeInTheDocument() to Vitest's expect.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Vitest globals are off, so Testing Library cannot clean up automatically.
// Storage and the URL hash are reset too, so tests cannot affect each other.
afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.location.hash = '';
});
