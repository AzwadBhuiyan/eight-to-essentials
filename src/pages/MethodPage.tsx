import { Disclaimer } from '../components/Disclaimer.tsx';
import { usePageFocus } from '../components/usePageFocus.ts';
import { e8Requirements, meta, productGroups } from '../data/index.ts';
import { inScope } from '../lib/effective.ts';
import { NOT_AFFILIATED, SMALL_BUSINESS_URL } from '../lib/siteText.ts';

const QUESTION_COUNTS = ([1, 2, 3] as const).map((t) => inScope(e8Requirements, t).length);
const LOCAL_IDS = e8Requirements.filter((r) => r.idSource === 'local').length;
const TRANSITIONING = 'https://www.cyber.gov.au/publication/transitioning-from-the-essential-eight';
const FAQ = 'https://www.cyber.gov.au/publication/frequently-asked-questions';

/** Marks a rule that is the author's own, not ASD's. Always shown as text. */
function OurRule() {
  return <span className="tag tag--own">Our rule</span>;
}

/** Method and sources: how everything is worked out, what is ASD's and what is ours, and the limits. */
export function MethodPage() {
  const headingRef = usePageFocus<HTMLHeadingElement>('Method and sources');
  return (
    <>
      <h1 ref={headingRef} tabIndex={-1}>
        Method and sources
      </h1>
      <p className="lead">
        How Eight to Essentials works, which rules come from ASD and which are our own, and its
        limits.
      </p>
      <Disclaimer />

      <section aria-labelledby="what">
        <h2 id="what">What this tool is</h2>
        <p>
          A free self-assessment and planning aid. It is not an official ASD assessment, an audit, a
          certification or a compliance tool. Results are only as good as the answers given, and the
          tool does not check any evidence.
        </p>
        <p>
          ASD says the Essentials series is written mainly for Commonwealth entities, critical
          infrastructure owners and operators, and large organisations. Smaller organisations can
          still use it where relevant (
          <a href={FAQ} rel="noopener noreferrer" target="_blank">
            ASD Essentials FAQ, page 3
          </a>
          ). ASD publishes separate{' '}
          <a href={SMALL_BUSINESS_URL} rel="noopener noreferrer" target="_blank">
            guidance for small businesses
          </a>{' '}
          on cyber.gov.au.
        </p>
      </section>

      <section aria-labelledby="scoring">
        <h2 id="scoring">How the Essential Eight check is scored</h2>
        <ul>
          <li>
            <strong>Target level.</strong> You choose Maturity Level One (the default), Two or
            Three. Only requirements up to your target are asked ({QUESTION_COUNTS[0]},{' '}
            {QUESTION_COUNTS[1]} or {QUESTION_COUNTS[2]} questions), and no result is ever above the
            target.
          </li>
          <li>
            <strong>Levels.</strong> A strategy is at a maturity level only when every requirement
            at that level and every lower level is met, as the Essential Eight maturity model says.
          </li>
          <li>
            <strong>Answers.</strong> &quot;Yes, and we can show evidence&quot; counts as met.
            &quot;Partly&quot;, &quot;No&quot; and &quot;Not sure&quot; never count as met;
            &quot;Not sure&quot; also adds an item to your evidence list. &quot;Skip for now&quot;
            leaves a question unanswered.
          </li>
          <li>
            <strong>&quot;Does not apply&quot; and exceptions.</strong> &quot;Does not apply&quot;
            is offered only where a requirement names a product or service you may genuinely not
            use, and needs a reason. An exception needs a reason, a compensating control, an
            approver and a review date, matching the maturity model&apos;s guidance on exceptions.
            Both count as met and are listed under &quot;Exceptions to review&quot;. <OurRule />{' '}
            Which requirements allow &quot;Does not apply&quot;, and the {productGroups.length}{' '}
            &quot;we don&apos;t use…&quot; product groups that answer several at once, are our own
            choices.
          </li>
          <li>
            <strong>Adaptive questions.</strong> Once a requirement in a strategy is not met, that
            strategy cannot reach that level, so its higher questions become optional. A level is
            still only shown when every required question has a valid answer. <OurRule />
          </li>
          <li>
            <strong>Shared requirements.</strong> Some requirements belong to several strategies
            (for example, protecting event logs). They are asked once and count for each strategy.
          </li>
          <li>
            <strong>Headline.</strong> The lowest strategy level, because ASD recommends reaching
            each maturity level across all eight strategies before moving to the next. It is only
            final when every strategy is complete. It is not an official &quot;overall
            maturity&quot;.
          </li>
          <li>
            <strong>Requirement IDs.</strong> Each requirement uses its ISM control ID where
            ASD&apos;s Assessment Workbook gives one. {LOCAL_IDS} requirements in the November 2023
            maturity model have no ISM ID in the workbook; they use our own IDs, starting
            &quot;E8MM-2023-&quot;. <OurRule />
          </li>
        </ul>
      </section>

      <section aria-labelledby="actions">
        <h2 id="actions">How the action list is ordered</h2>
        <ul>
          <li>
            Unmet requirements, ordered by maturity level first, then internet-facing and identity
            requirements (matching ASD&apos;s priority phase 1 focus on boundary and identity
            services), then effort. <OurRule />
          </li>
          <li>
            Effort (quick win, moderate, project) is our own rough estimate, not ASD&apos;s.{' '}
            <OurRule />
          </li>
          <li>
            If you are no longer required to report Essential Eight maturity, the list is framed as
            &quot;Risk-reduction actions&quot; and puts work linked to priority phase 1 first,
            following ASD&apos;s advice not to start work only to reach a superseded Essential Eight
            target (
            <a href={TRANSITIONING} rel="noopener noreferrer" target="_blank">
              Transitioning from the Essential Eight, page 22
            </a>
            ).
          </li>
        </ul>
      </section>

      <section aria-labelledby="transition">
        <h2 id="transition">How the ASD Essentials transition view works</h2>
        <p>
          ASD says Essential Eight ratings do not automatically convert into ASD Essentials
          effectiveness ratings, and even Maturity Level Three does not automatically produce fully
          effective ratings. The transition view is therefore indicative only, and never gives an
          ASD Essentials rating.
        </p>
        <ul>
          <li>
            <strong>ASD&apos;s mapping.</strong> For each ASD Essentials action and domain,
            ASD&apos;s transition tables say which Essential Eight strategy and maturity level
            contributes, and whether fully or only in part. Your level for that strategy is compared
            with it: &quot;May contribute&quot;, &quot;Partial coverage in [domain]&quot; or
            &quot;Gap&quot;. A partial row is always labelled as partial, even where ASD&apos;s note
            says &quot;strong evidence&quot;.
          </li>
          <li>
            <strong>Several strategies.</strong> Where more than one strategy maps to the same
            action and domain (for example, the two patching strategies), the weakest result counts.{' '}
            <OurRule />
          </li>
          <li>
            <strong>Roll-up to principles.</strong> The weakest mapped action sets each
            principle&apos;s finding, using ASD&apos;s gap terms. Actions with no Essential Eight
            mapping are not counted as &quot;not addressed&quot;, because that is a fact about the
            framework, not about you; instead, a principle with any unmapped action is at most
            &quot;partially addressed&quot;, and the page shows how many actions are mapped.{' '}
            <OurRule />
          </li>
          <li>
            <strong>Above your target.</strong> If ASD lists a higher Essential Eight level than the
            target you chose, that row shows &quot;Not assessed (above your target)&quot;, not a
            gap.
          </li>
          <li>
            <strong>Evidence to check.</strong> Where ASD cites Essential Eight controls as possible
            evidence for an action but gives no mapping, they are listed as &quot;E8 evidence to
            check&quot;, with no status.
          </li>
          <li>
            <strong>Not covered by the Essential Eight.</strong> Actions with no Essential Eight
            equivalent are listed separately: they need new work whatever your results.
          </li>
        </ul>
      </section>

      <section aria-labelledby="inconsistencies">
        <h2 id="inconsistencies">Where ASD&apos;s documents disagree</h2>
        <ul>
          <li>
            <strong>PRO-09.2 &quot;Block outbound network connections&quot;.</strong> Transitioning
            from the Essential Eight (Table 8, page 18) maps user application hardening to this
            action in User devices. ASD Essentials for enterprise IT (Matrix 3, page 17), the
            Assessment Workbook and the Assessment evidence guide (page 46) all say the action only
            applies to Boundary services and Critical processes and services. We follow the chapter,
            workbook and evidence guide and drop that row, so this action is listed as not covered
            by the Essential Eight.
          </li>
          <li>
            <strong>DET-04 title.</strong> The workbook says &quot;Baseline high-risk access
            activities&quot;; the chapter says &quot;Baselined&quot;. We use the chapter&apos;s
            title.
          </li>
          <li>
            <strong>Essential Eight versions.</strong> The maturity model (November 2023) is our
            source for requirement wording and levels. ASD&apos;s evidence guide and workbook refer
            to an October 2024 version of the Essential Eight; we use them only to attach ISM IDs
            and link requirements to ASD Essentials actions.
          </li>
        </ul>
      </section>

      <section aria-labelledby="limits">
        <h2 id="limits">Limitations</h2>
        <ul>
          <li>
            It is a self-assessment: answers are not checked, and people tend to rate themselves
            generously.
          </li>
          <li>
            Requirements are paraphrased in plain English, which can lose some nuance. Check the
            official wording before relying on a result.
          </li>
          <li>
            The action ordering, effort estimates, product groups and transition roll-up are our own
            rules, layered on ASD&apos;s guidance.
          </li>
          <li>
            Only the ASD Essentials enterprise IT chapter is covered, not the cloud or operational
            technology chapters.
          </li>
          <li>ASD will keep updating its guidance. The data was last checked on the date below.</li>
        </ul>
      </section>

      <section aria-labelledby="sources">
        <h2 id="sources">Sources</h2>
        <ul>
          {meta.documents.map((d) => (
            <li key={d.url}>
              <a href={d.url} rel="noopener noreferrer" target="_blank">
                {d.name}
              </a>
            </li>
          ))}
        </ul>
        <p>
          {meta.licence.attribution} Material is used under the{' '}
          <a href={meta.licence.url} rel="noopener noreferrer" target="_blank">
            {meta.licence.name}
          </a>{' '}
          licence.
        </p>
        <p>
          <strong>{NOT_AFFILIATED}</strong>
        </p>
      </section>

      <footer className="method-footer">
        <p>
          Framework versions: {meta.frameworks.map((f) => `${f.name} (${f.version})`).join('; ')}.
        </p>
        <p>Data checked against the official documents on {meta.dataCheckedOn}.</p>
      </footer>
    </>
  );
}
