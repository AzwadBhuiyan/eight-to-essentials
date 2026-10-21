/**
 * The heavier pages, loaded only when first visited, to keep the first download small.
 *
 * Each page can also be preloaded. Once its code has arrived it renders straight away, without
 * showing "Loading…" again. The test setup preloads every page, so tests can check pages as soon
 * as they navigate.
 */
import { lazy, type ComponentType } from 'react';

function lazyPage<P extends object>(load: () => Promise<ComponentType<P>>) {
  let loaded: ComponentType<P> | null = null;
  const preload = () =>
    load().then((component) => {
      loaded = component;
      return component;
    });
  const Lazy = lazy(() => preload().then((component) => ({ default: component })));
  function Page(props: P) {
    const Loaded = loaded;
    return Loaded ? <Loaded {...props} /> : <Lazy {...props} />;
  }
  return { Page, preload };
}

const results = lazyPage(() => import('./ResultsPage.tsx').then((m) => m.ResultsPage));
const transition = lazyPage(() => import('./TransitionPage.tsx').then((m) => m.TransitionPage));
const report = lazyPage(() => import('./ReportPage.tsx').then((m) => m.ReportPage));
const method = lazyPage(() => import('./MethodPage.tsx').then((m) => m.MethodPage));

export const lazyPages = {
  Results: results.Page,
  Transition: transition.Page,
  Report: report.Page,
  Method: method.Page,
};

/** Loads every lazy page's code. Used by the tests. */
export function preloadPages(): Promise<unknown> {
  return Promise.all([results.preload(), transition.preload(), report.preload(), method.preload()]);
}
