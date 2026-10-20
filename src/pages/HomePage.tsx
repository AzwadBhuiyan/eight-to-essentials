import { Disclaimer } from '../components/Disclaimer.tsx';
import { usePageFocus } from '../components/usePageFocus.ts';
import { LAUNCH_NOTICE } from '../lib/text.ts';
import { href } from '../router.ts';

export function HomePage() {
  const headingRef = usePageFocus<HTMLHeadingElement>('Eight to Essentials');
  return (
    <>
      <h1 ref={headingRef} tabIndex={-1}>
        Eight to Essentials
      </h1>
      <p className="lead">Check your Essential Eight. Plan your move to ASD Essentials.</p>
      <p className="notice">{LAUNCH_NOTICE}</p>
      <ul className="benefits">
        <li>
          <strong>Check your Essential Eight maturity</strong> for each of the eight strategies,
          from Maturity Level Zero to Three.
        </li>
        <li>
          <strong>See where your work may carry over</strong> to ASD Essentials, using ASD&apos;s
          own transition mapping, and what is new.
        </li>
        <li>
          <strong>Get a prioritised action list</strong> and an evidence request list.
        </li>
      </ul>
      <p>
        Free, open source and runs entirely in your browser. No accounts, no tracking, and nothing
        you enter leaves your device.
      </p>
      <Disclaimer />
      <p>
        <a className="button" href={href('/context')}>
          Start assessment
        </a>
      </p>
    </>
  );
}
