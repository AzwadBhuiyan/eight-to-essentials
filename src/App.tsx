import { author, repositoryUrl } from './config/author.ts';

// Placeholder shell. Pages, routing and the real footer arrive in later phases.
export default function App() {
  return (
    <>
      <main>
        <h1>Eight to Essentials</h1>
        <p>Check your Essential Eight. Plan your move to ASD Essentials.</p>
      </main>
      <footer>
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
      </footer>
    </>
  );
}
