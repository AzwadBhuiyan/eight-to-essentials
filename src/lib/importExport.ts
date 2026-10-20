/**
 * Export and import of answers as JSON, and export of answers as CSV.
 *
 * Imported files are untrusted. They are checked before anything is used:
 * - files over 1 MB are rejected before they are read
 * - the JSON must match a strict schema: unknown fields and wrong types are rejected
 * - every answer, skipped question and product group must be known to this version of the app
 * - text fields have length limits
 * Answers that break the answer rules (for example an exception missing its approver) are still
 * accepted, because they may be work in progress; the wizard shows what is missing.
 *
 * File versions: version 2 adds the target level, product groups and skipped questions.
 * Version 1 files are still accepted; they are given target Maturity Level Three, because they
 * were made when every question was asked (methodology D29).
 */
import { z } from 'zod';
import type { E8Requirement } from '../data/types.ts';
import { isMet, validAnswerFor } from './answers.ts';
import type { AssessmentState } from './assessment.ts';
import { toCsv } from './csv.ts';
import { effectiveAnswers, inScope } from './effective.ts';
import { ANSWER_LABELS, LEVEL_NAMES } from './text.ts';

export const MAX_IMPORT_BYTES = 1024 * 1024; // 1 MB
export const EXPORT_FORMAT = 'eight-to-essentials-answers';
export const EXPORT_VERSION = 2;

const shortText = z.string().max(200);
const longText = z.string().max(2000);

const answerSchema = z.discriminatedUnion('value', [
  z.strictObject({ value: z.enum(['yes', 'partly', 'no', 'not-sure']) }),
  z.strictObject({ value: z.literal('not-applicable'), reason: longText }),
  z.strictObject({
    value: z.literal('exception'),
    reason: longText,
    compensatingControl: longText,
    approvedBy: shortText,
    reviewDate: z.string().max(10),
  }),
]);

const contextV1 = {
  organisationName: shortText,
  e8ReportingRequired: z.enum(['yes', 'no', 'not-sure']),
  systemsLocation: z.enum(['own-hybrid-iaas', 'saas-paas', 'not-sure']),
};

/** IDs and group names the file may refer to, from the current data. */
export interface Catalogue {
  requirements: E8Requirement[];
  productGroupIds: string[];
}

function schemas(catalogue: Catalogue) {
  const knownIds = new Set(catalogue.requirements.map((r) => r.id));
  const knownGroups = new Set(catalogue.productGroupIds);
  const answers = z
    .record(z.string(), answerSchema)
    .refine((a) => Object.keys(a).every((id) => knownIds.has(id)), {
      message: 'Contains answers for requirements that are not in this version of the app.',
    });
  const header = { format: z.literal(EXPORT_FORMAT), exportedAt: z.iso.datetime() };

  const v1 = z.strictObject({
    ...header,
    version: z.literal(1),
    context: z.strictObject(contextV1),
    answers,
  });
  const v2 = z.strictObject({
    ...header,
    version: z.literal(2),
    context: z.strictObject({
      ...contextV1,
      targetLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    }),
    answers,
    productGroups: z
      .record(z.string(), z.strictObject({ reason: longText }))
      .refine((g) => Object.keys(g).every((id) => knownGroups.has(id)), {
        message: 'Contains product groups that are not in this version of the app.',
      }),
    skipped: z
      .array(z.string())
      .max(knownIds.size)
      .refine((s) => s.every((id) => knownIds.has(id)) && new Set(s).size === s.length, {
        message: 'Contains unknown or repeated skipped questions.',
      }),
  });
  return { v1, v2 };
}

export interface ExportFile {
  format: typeof EXPORT_FORMAT;
  version: typeof EXPORT_VERSION;
  exportedAt: string;
  context: AssessmentState['context'];
  answers: AssessmentState['answers'];
  productGroups: AssessmentState['productGroups'];
  skipped: AssessmentState['skipped'];
}

export function buildExport(state: AssessmentState, now: Date): ExportFile {
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: now.toISOString(),
    context: state.context,
    answers: state.answers,
    productGroups: state.productGroups,
    skipped: state.skipped,
  };
}

export type ImportResult = { ok: true; state: AssessmentState } | { ok: false; errors: string[] };

function issues(error: z.ZodError): string[] {
  return error.issues.slice(0, 10).map((i) => `${i.path.join('.') || 'File'}: ${i.message}`);
}

/**
 * Checks an imported file.
 * @param text the file's contents
 * @param sizeInBytes the file's size, checked first so a huge file is never parsed
 */
export function parseImport(text: string, sizeInBytes: number, catalogue: Catalogue): ImportResult {
  if (sizeInBytes > MAX_IMPORT_BYTES || text.length > MAX_IMPORT_BYTES) {
    return { ok: false, errors: ['The file is larger than 1 MB.'] };
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, errors: ['The file is not valid JSON.'] };
  }
  const { v1, v2 } = schemas(catalogue);
  const version = (json as { version?: unknown } | null)?.version;

  if (version === 1) {
    const result = v1.safeParse(json);
    if (!result.success) return { ok: false, errors: issues(result.error) };
    return {
      ok: true,
      state: {
        context: { ...result.data.context, targetLevel: 3 },
        answers: result.data.answers,
        productGroups: {},
        skipped: [],
      },
    };
  }
  const result = v2.safeParse(json);
  if (!result.success) return { ok: false, errors: issues(result.error) };
  const { context, answers, productGroups, skipped } = result.data;
  return { ok: true, state: { context, answers, productGroups, skipped } };
}

/**
 * One row per requirement, in the data file's order, using the answers that count (including
 * product group answers). All cells are protected against formula injection.
 */
export function answersToCsv(state: AssessmentState, requirements: E8Requirement[]): string {
  const { answers, fromGroup } = effectiveAnswers(state, requirements);
  const asked = new Set(inScope(requirements, state.context.targetLevel).map((r) => r.id));
  const header = [
    'Requirement ID',
    'Strategies',
    'Maturity levels',
    'Asked for your target',
    'Requirement (plain English)',
    'Answer',
    'Answer from',
    'Counts as met',
    'Reason',
    'Compensating control',
    'Approved by',
    'Review date',
  ];
  const rows = requirements.map((r) => {
    const answer = answers[r.id];
    const valid = validAnswerFor(r, answers);
    const skipped = !answer && state.skipped.includes(r.id);
    return [
      r.id,
      r.strategies.join('; '),
      r.levels.map((l) => `ML${l}`).join('; '),
      asked.has(r.id) ? 'Yes' : 'No',
      r.plainText,
      answer ? ANSWER_LABELS[answer.value] : skipped ? 'Skipped' : 'Not answered',
      fromGroup[r.id] ? `Product group: ${fromGroup[r.id]}` : answer ? 'Own answer' : '',
      valid ? (isMet(valid) ? 'Yes' : 'No') : answer ? 'No (answer incomplete)' : '',
      answer && 'reason' in answer ? answer.reason : '',
      answer?.value === 'exception' ? answer.compensatingControl : '',
      answer?.value === 'exception' ? answer.approvedBy : '',
      answer?.value === 'exception' ? answer.reviewDate : '',
    ];
  });
  const organisation = state.context.organisationName.trim();
  const title = [
    `Eight to Essentials answers${organisation ? ` for ${organisation}` : ''}. Target: ${LEVEL_NAMES[state.context.targetLevel]}. Self-assessment, not an official assessment.`,
  ];
  return toCsv([title, header, ...rows]);
}
