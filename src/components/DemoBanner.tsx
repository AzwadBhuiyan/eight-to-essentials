import { DEMO_LABEL, DEMO_PROFILE } from '../lib/demo.ts';
import { href } from '../router.ts';

/**
 * Shown at the top of every demo screen. "Exit demo" returns to the user's own data: their own
 * results if they have any answers, otherwise the home page.
 */
export function DemoBanner({ userHasAnswers }: { userHasAnswers: boolean }) {
  return (
    <div className="demo-banner" role="note" aria-label={DEMO_LABEL}>
      <p>
        <strong>
          {DEMO_LABEL}: {DEMO_PROFILE.name}.
        </strong>{' '}
        These are example answers, not yours. Your own answers are not changed.
      </p>
      <a className="button" href={href(userHasAnswers ? '/results' : '/')}>
        Exit demo
      </a>
    </div>
  );
}
