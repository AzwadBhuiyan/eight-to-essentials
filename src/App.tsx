import { Layout } from './components/Layout.tsx';
import { usePageFocus } from './components/usePageFocus.ts';
import { STRATEGIES } from './data/types.ts';
import { AssessmentPage } from './pages/AssessmentPage.tsx';
import { AboutPage } from './pages/AboutPage.tsx';
import { ContextPage } from './pages/ContextPage.tsx';
import { MethodPage } from './pages/MethodPage.tsx';
import { ReportPage } from './pages/ReportPage.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { ResultsPage } from './pages/ResultsPage.tsx';
import { TransitionPage } from './pages/TransitionPage.tsx';
import { href, useRoute } from './router.ts';
import { AssessmentProvider } from './state/AssessmentProvider.tsx';
import { DemoProvider } from './state/DemoProvider.tsx';
import { useAssessment } from './state/assessmentContext.ts';
import { DemoBanner } from './components/DemoBanner.tsx';

function Page({ path }: { path: string }) {
  if (path === '/') return <HomePage />;
  if (path === '/context') return <ContextPage />;
  if (path === '/example' || path.startsWith('/example/')) return <DemoRoute path={path} />;
  if (path === '/results') return <ResultsPage />;
  if (path === '/transition') return <TransitionPage />;
  if (path === '/report') return <ReportPage />;
  if (path === '/about') return <AboutPage />;
  if (path === '/method') return <MethodPage />;
  const step = /^\/assessment\/(\d+)$/.exec(path);
  if (step) {
    const n = Number(step[1]);
    if (n >= 1 && n <= STRATEGIES.length) return <AssessmentPage key={n} step={n} />;
  }
  return <NotFound />;
}

/**
 * The fictional demo's screens. They read the demo's answers from DemoProvider; the user's own
 * answers stay in AssessmentProvider outside and are never read into or written from here.
 */
function DemoRoute({ path }: { path: string }) {
  const own = useAssessment();
  const userHasAnswers =
    Object.keys(own.state.answers).length > 0 || Object.keys(own.state.productGroups).length > 0;
  const step = /^\/example\/assessment\/(\d+)$/.exec(path);
  let page = <NotFound />;
  if (path === '/example') page = <ResultsPage />;
  else if (path === '/example/transition') page = <TransitionPage />;
  else if (path === '/example/report') page = <ReportPage />;
  else if (step && Number(step[1]) >= 1 && Number(step[1]) <= STRATEGIES.length) {
    page = <AssessmentPage key={step[1]} step={Number(step[1])} />;
  }
  return (
    <DemoProvider>
      <DemoBanner userHasAnswers={userHasAnswers} />
      {page}
    </DemoProvider>
  );
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
