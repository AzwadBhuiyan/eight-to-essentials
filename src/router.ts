/**
 * A tiny hash-based router.
 *
 * GitHub Pages only serves real files, so a URL like /eight-to-essentials/results would give a
 * 404 on refresh. With hash routing the page is always index.html and the route lives after the
 * "#" (for example /eight-to-essentials/#/results), which the browser never sends to the server.
 */
import { useSyncExternalStore } from 'react';

function currentPath(): string {
  const hash = window.location.hash.replace(/^#/, '');
  return hash.startsWith('/') ? hash : '/';
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

/** The current route, for example "/assessment/2". Re-renders when the hash changes. */
export function useRoute(): string {
  return useSyncExternalStore(subscribe, currentPath, () => '/');
}

export function navigate(path: string): void {
  window.location.hash = path;
}

/** The href for a route, for use in links. */
export function href(path: string): string {
  return `#${path}`;
}
