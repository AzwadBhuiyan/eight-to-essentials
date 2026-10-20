import type { ReactNode } from 'react';
import { author, repositoryUrl } from '../config/author.ts';
import { href } from '../router.ts';

/** Page frame: skip link, header with navigation, main content and the author footer. */
export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <header className="site-header">
        <div className="container site-header__inner">
          <a className="site-name" href={href('/')}>
            Eight to Essentials
          </a>
          <nav aria-label="Main">
            <ul className="nav-list">
              <li>
                <a href={href('/context')}>Assessment</a>
              </li>
              <li>
                <a href={href('/results')}>Results</a>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      {/* tabIndex lets pages move focus here after navigation, for screen reader users. */}
      <main id="main" className="container" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <div className="container">
          <p>
            Built by{' '}
            <a href={author.linkedInUrl} rel="noopener noreferrer" target="_blank">
              {author.name}
            </a>{' '}
            ·{' '}
            <a href={repositoryUrl} rel="noopener noreferrer" target="_blank">
              Source on GitHub
            </a>
          </p>
          <p className="muted">
            Not affiliated with or endorsed by the Australian Signals Directorate (ASD) or the
            Australian Cyber Security Centre (ACSC).
          </p>
        </div>
      </footer>
    </>
  );
}
