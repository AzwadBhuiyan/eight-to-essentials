/**
 * Wording for the home page, the journey indicator and the strategy introductions
 * (methodology D36 to D38). Every factual sentence carries its source.
 */
import type { Strategy } from '../data/types.ts';

export interface SourceLink {
  label: string;
  url: string;
}

const MATURITY_MODEL = 'https://www.cyber.gov.au/publication/essential-eight-maturity-model';
const ENTERPRISE_IT = 'https://www.cyber.gov.au/publication/essentials-for-enterprise-it';
const TRANSITIONING = 'https://www.cyber.gov.au/publication/transitioning-from-the-essential-eight';
const FAQ = 'https://www.cyber.gov.au/publication/frequently-asked-questions';
const NEWS =
  'https://www.asd.gov.au/news/2026-10-15-asd-essentials-evolving-our-approach-cyber-security-resilience';

export const HOME_HEADLINE =
  'Find your Essential Eight level, and see what it means for ASD Essentials.';

/** Methodology D36: the explainer. Each sentence is paired with the document that supports it. */
export const EXPLAINER: { text: string; sources: SourceLink[] }[] = [
  {
    text: 'ASD describes the Essential Eight as the most effective of its strategies to mitigate cyber security incidents.',
    sources: [{ label: 'Essential Eight maturity model, page 1', url: MATURITY_MODEL }],
  },
  {
    text: 'Maturity Level Two has been the required baseline for Commonwealth entities.',
    sources: [{ label: 'Transitioning from the Essential Eight, page 9', url: TRANSITIONING }],
  },
  {
    text: 'ASD Essentials is its successor.',
    sources: [{ label: 'ASD Essentials FAQ, page 2', url: FAQ }],
  },
  {
    text: 'ASD published it on 15 October 2026 and describes it as an evolution of the Essential Eight. Both are maintained during the transition.',
    sources: [{ label: 'ASD news release, 15 October 2026', url: NEWS }],
  },
  {
    text: 'This tool checks your Essential Eight level and helps you plan for ASD Essentials.',
    sources: [],
  },
];

/** Methodology D36: the author's own estimate, labelled as such. */
export const TIME_ESTIMATE = 'About 20 to 30 minutes (our estimate).';

export const TRUST_DOCUMENTS: SourceLink[] = [
  { label: 'Essential Eight maturity model', url: MATURITY_MODEL },
  { label: 'ASD Essentials for enterprise IT', url: ENTERPRISE_IT },
  { label: 'Transitioning from the Essential Eight', url: TRANSITIONING },
];

export const NOT_AFFILIATED =
  'Not affiliated with or endorsed by the Australian Signals Directorate (ASD) or the Australian Cyber Security Centre (ACSC).';

export const HOW_IT_WORKS = [
  'Answer questions',
  'See your Essential Eight level',
  'See what carries into ASD Essentials (optional)',
] as const;

/** Methodology D38: the journey indicator shown on every journey page. */
export const JOURNEY_STEPS = [
  { step: 1, label: 'Essential Eight questions', path: '/context' },
  { step: 2, label: 'Your Essential Eight result', path: '/results' },
  { step: 3, label: 'ASD Essentials (optional)', path: '/transition' },
] as const;

/**
 * Methodology D37: one short statement introducing each strategy (the author's wording). They are
 * statements, not questions, so they cannot be mistaken for questions to answer.
 */
export const STRATEGY_INTROS: Record<Strategy, string> = {
  'Patch applications': 'Known security flaws in your software are fixed quickly.',
  'Patch operating systems': 'Servers, computers and network devices are kept up to date.',
  'Multi-factor authentication': "A stolen password alone isn't enough to get in.",
  'Restrict administrative privileges':
    'Powerful admin accounts are limited and kept separate from everyday use.',
  'Application control': 'Only approved programs can run.',
  'Restrict Microsoft Office macros': 'Risky macros in documents are blocked.',
  'User application hardening': 'Web browsers, Office and PDF software are locked down.',
  'Regular backups': 'You can recover if ransomware hits.',
};

export const PARTS = [
  { part: 1, label: 'Part 1: your Essential Eight result', path: '/results' },
  {
    part: 2,
    label: 'Part 2 (optional): how this carries into ASD Essentials',
    path: '/transition',
  },
] as const;

/**
 * ASD's guidance for small businesses. The ASD Essentials FAQ (page 3) says ASD publishes it on
 * cyber.gov.au; this is the Small business hub's address.
 */
export const SMALL_BUSINESS_URL =
  'https://www.cyber.gov.au/business-government/small-business-cyber-security/small-business-hub';

/** About page (in the author's words). */
export const ABOUT_WHY =
  'I built Eight to Essentials in the weeks after ASD published ASD Essentials, to help organisations see where they stand on the Essential Eight and where to start on the new framework.';

export const ABOUT_SKILLS = [
  'Governance, risk and compliance (GRC)',
  'Assessment design',
  'Risk-based prioritisation',
  'Secure web development',
] as const;

/** Printed at the bottom of every page of the report. */
export function printFooterText(authorName: string, fictionalDemo: boolean): string {
  return `${fictionalDemo ? 'Fictional demo company · ' : ''}Created with Eight to Essentials by ${authorName} · Self-assessment, not an official assessment`;
}

/** The report date, written out in Australian style, for example "22 October 2026". */
export function reportDate(now: Date): string {
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);
}
