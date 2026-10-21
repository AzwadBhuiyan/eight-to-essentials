import { PARTS } from '../lib/siteText.ts';
import { href } from '../router.ts';
import { useAssessment } from '../state/assessmentContext.ts';

/** "Part 1: your Essential Eight result. Part 2 (optional): …" with the current part marked. */
export function PartsSummary({ current }: { current: 1 | 2 }) {
  const { paths } = useAssessment();
  const pathFor = { 1: paths.results, 2: paths.transition } as const;
  return (
    <nav className="parts" aria-label="Parts of your result">
      <ul>
        {PARTS.map((p) => (
          <li key={p.part}>
            {p.part === current ? (
              <span aria-current="page">
                <strong>{p.label}</strong> (you are here)
              </span>
            ) : (
              <a href={href(pathFor[p.part])}>{p.label}</a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
