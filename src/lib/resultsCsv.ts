/**
 * Results export as one CSV file, laid out for spreadsheets:
 * - the first column ("Section") holds one short word: Note, Headline, Strategy, Action,
 *   Evidence or Exception, so it stays narrow and can be filtered
 * - long text (the disclaimer, the action list framing) goes in the wide "Item" column
 * - "Strategy level" is filled for the headline and strategy rows, "Requirement level" for the
 *   action and evidence rows, so a strategy's result and a requirement's level are never mixed up
 * All cells go through csvCell, which neutralises formula-like text.
 */
import type { ProductGroup } from '../data/types.ts';
import { toCsv } from './csv.ts';
import { headlineStatus, headlineText, strategyResultText } from './resultsText.ts';
import { lowestLevel } from './scoring.ts';
import { ANSWER_LABELS, DISCLAIMER, LEVEL_NAMES, actionListCoverageNote } from './text.ts';
import type {
  ActionList,
  AssessmentContext,
  E8Result,
  EvidenceRequest,
  ExceptionItem,
} from './types.ts';

export interface ResultsForExport {
  context: AssessmentContext;
  e8: E8Result;
  actionList: ActionList;
  evidence: EvidenceRequest[];
  exceptions: ExceptionItem[];
  productGroups: ProductGroup[];
}

const EFFORT_LABEL = {
  'quick-win': 'Quick win',
  moderate: 'Moderate',
  project: 'Project',
} as const;

export const RESULTS_CSV_HEADER = [
  'Section',
  'Strategy',
  'Requirement ID',
  'Item',
  'Strategy level',
  'Requirement level',
  'Status',
  'Details',
] as const;

type Row = [
  section: 'Note' | 'Headline' | 'Strategy' | 'Action' | 'Evidence' | 'Exception',
  strategy: string,
  requirementId: string,
  item: string,
  strategyLevel: string,
  requirementLevel: string,
  status: string,
  details: string,
];

const level = (value: 0 | 1 | 2 | 3 | null) => (value === null ? '' : LEVEL_NAMES[value]);
const joinDetails = (parts: (string | null | false)[]) => parts.filter(Boolean).join(' | ');

export function resultsToCsv(results: ResultsForExport): string {
  const { context, e8, actionList, evidence, exceptions, productGroups } = results;
  const groupLabel = new Map(productGroups.map((g) => [g.id, g.label]));
  const organisation = context.organisationName.trim();
  const target = `Target: ${LEVEL_NAMES[e8.target]}`;
  const headline = headlineStatus(e8);

  const rows: Row[] = [
    [
      'Note',
      '',
      '',
      `Eight to Essentials results${organisation ? ` for ${organisation}` : ''}. ${DISCLAIMER}`,
      '',
      '',
      '',
      '',
    ],
    // The level is the headline's own level (final or not), never the target.
    [
      'Headline',
      '',
      '',
      headlineText(e8),
      level(headline.level),
      '',
      headline.final ? 'Final' : 'Not final',
      target,
    ],
  ];

  for (const s of e8.strategies) {
    rows.push([
      'Strategy',
      s.strategy,
      '',
      strategyResultText(s),
      level(s.level),
      '',
      s.status === 'complete' ? 'Complete' : 'Incomplete',
      target,
    ]);
  }

  rows.push([
    'Note',
    '',
    '',
    actionList.title,
    '',
    '',
    '',
    joinDetails([
      actionList.advice,
      actionListCoverageNote(actionList.notNeededCount, actionList.skippedCount),
      actionList.items.length === 0 &&
        'No actions: every answered requirement up to your target is met.',
    ]),
  ]);

  for (const item of actionList.items) {
    const r = item.requirement;
    rows.push([
      'Action',
      r.strategies.join('; '),
      r.id,
      r.plainText,
      '',
      LEVEL_NAMES[item.level],
      ANSWER_LABELS[item.answer],
      joinDetails([
        `Next step: ${item.nextStep}`,
        `Effort (our estimate): ${EFFORT_LABEL[r.effort]}`,
        item.relatedPrinciples.length > 0 &&
          `Related ASD Essentials principles: ${item.relatedPrinciples.map((p) => `${p.id} ${p.title}`).join('; ')}`,
      ]),
    ]);
  }

  for (const { requirement: r } of evidence) {
    rows.push([
      'Evidence',
      r.strategies.join('; '),
      r.id,
      r.plainText,
      '',
      LEVEL_NAMES[lowestLevel(r)],
      'Not sure',
      `Evidence that would show this: ${r.evidence.join('; ')}`,
    ]);
  }

  for (const e of exceptions) {
    const r = e.requirement;
    rows.push([
      'Exception',
      r.strategies.join('; '),
      r.id,
      r.plainText,
      '',
      '',
      ANSWER_LABELS[e.answer.value],
      e.answer.value === 'exception'
        ? joinDetails([
            `Reason: ${e.answer.reason}`,
            `Compensating control: ${e.answer.compensatingControl}`,
            `Approved by: ${e.answer.approvedBy}`,
            `Review date: ${e.answer.reviewDate}${e.reviewOverdue ? ' (review overdue)' : ''}`,
          ])
        : joinDetails([
            `Reason: ${e.answer.reason}`,
            e.groupId && `From: ${groupLabel.get(e.groupId) ?? e.groupId}`,
          ]),
    ]);
  }

  return toCsv([[...RESULTS_CSV_HEADER], ...rows]);
}
