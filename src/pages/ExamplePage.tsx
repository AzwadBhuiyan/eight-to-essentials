import { usePageFocus } from '../components/usePageFocus.ts';
import { href } from '../router.ts';

/** Placeholder for the example result (methodology D36). Phase 7 replaces it with the demo company. */
export function ExamplePage() {
  const headingRef = usePageFocus<HTMLHeadingElement>('Example result');
  return (
    <>
      <h1 ref={headingRef} tabIndex={-1}>
        Example result
      </h1>
      <section className="card card--placeholder">
        <p className="placeholder-label">The example company is being added.</p>
        <p>
          It will show a complete result for a fictional company, so you can see what you get before
          answering any questions.
        </p>
      </section>
      <p>
        <a className="button" href={href('/context')}>
          Start my assessment
        </a>
      </p>
    </>
  );
}
