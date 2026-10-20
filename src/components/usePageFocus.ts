import { useEffect, useRef } from 'react';

/**
 * Sets the document title and moves keyboard and screen reader focus to the page heading
 * when a page or wizard step appears, so users know the page has changed.
 * @param title used for the browser tab, and as the key: focus moves again when it changes
 */
export function usePageFocus<T extends HTMLElement>(title: string) {
  const ref = useRef<T>(null);
  useEffect(() => {
    document.title = title === 'Eight to Essentials' ? title : `${title} · Eight to Essentials`;
    ref.current?.focus();
  }, [title]);
  return ref;
}
