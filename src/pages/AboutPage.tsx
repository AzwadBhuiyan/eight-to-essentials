import { Disclaimer } from '../components/Disclaimer.tsx';
import { usePageFocus } from '../components/usePageFocus.ts';
import { author, repositoryUrl } from '../config/author.ts';
import { meta } from '../data/index.ts';
import { ABOUT_SKILLS, ABOUT_WHY, NOT_AFFILIATED } from '../lib/siteText.ts';
import { href } from '../router.ts';

/** About page: who built it, why, the skills involved, and how to get in touch (LinkedIn only). */
export function AboutPage() {
  const headingRef = usePageFocus<HTMLHeadingElement>('About');
  return (
    <>
      <h1 ref={headingRef} tabIndex={-1}>
        About Eight to Essentials
      </h1>

      <section aria-labelledby="who">
        <h2 id="who">Who built it</h2>
        <p>
          {author.name}, {author.title}, {author.location}.
        </p>
        <p>{ABOUT_WHY}</p>
      </section>

      <section aria-labelledby="skills">
        <h2 id="skills">Skills involved</h2>
        <ul>
          {ABOUT_SKILLS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p>
          The scoring, prioritisation and transition rules are explained on the{' '}
          <a href={href('/method')}>Method and sources</a> page. The code is open source on{' '}
          <a href={repositoryUrl} rel="noopener noreferrer" target="_blank">
            GitHub
          </a>
          .
        </p>
      </section>

      <section aria-labelledby="contact">
        <h2 id="contact">Contact</h2>
        <p>
          Get in touch on{' '}
          <a href={author.linkedInUrl} rel="noopener noreferrer" target="_blank">
            LinkedIn
          </a>
          .
        </p>
      </section>

      <Disclaimer />
      <p className="muted">
        {meta.licence.attribution} {NOT_AFFILIATED}
      </p>
    </>
  );
}
