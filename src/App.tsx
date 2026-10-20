import { Layout } from './components/Layout.tsx';
import { usePageFocus } from './components/usePageFocus.ts';
import { STRATEGIES } from './data/types.ts';
import { AssessmentPage } from './pages/AssessmentPage.tsx';
import { ContextPage } from './pages/ContextPage.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { ResultsPage } from './pages/ResultsPage.tsx';
import { href, useRoute } from './router.ts';
import { AssessmentProvider } from './state/AssessmentProvider.tsx';

function Page({ path }: { path: string }) {
  if (path === '/') return <HomePage />;
  if (path === '/context') return <ContextPage />;
  if (path === '/results') return <ResultsPage />;
  const step = /^\/assessment\/(\d+)$/.exec(path);
  if (step) {
    const n = Number(step[1]);
    if (n >= 1 && n <= STRATEGIES.length) return <AssessmentPage key={n} step={n} />;
  }
  return <NotFound />;
}

function NotFound() {
  const headingRef = usePageFocus<HTMLHeadingElement>('Page not found');
  return (
    <>
      <h1 ref={headingRef} tabIndex={-1}>
        Page not found
      </h1>
      <p>
        <a href={href('/')}>Go to the home page</a>
      </p>
    </>
  );
}

export default function App() {
  const path = useRoute();
  return (
    <AssessmentProvider>
      <Layout>
        <Page path={path} />
      </Layout>
    </AssessmentProvider>
  );
}
