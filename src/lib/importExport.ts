/**
 * Export and import of answers as JSON, and export of answers as CSV.
 *
 * Imported files are untrusted. They are checked before anything is used:
 * - files over 1 MB are rejected before they are read
 * - the JSON must match a strict schema: unknown fields and wrong types are rejected
 * - every answer must belong to a known requirement
 * - text fields have length limits
 * Answers that break the answer rules (for example an exception missing its approver) are still
 * accepted, because they may be work in progress; the wizard shows what is missing.
 */
import { z } from 'zod';
import type { E8Requirement } from '../data/types.ts';
import { isMet } from './answers.ts';
import type { AssessmentState } from './assessment.ts';
import { toCsv } from './csv.ts';
import { ANSWER_LABELS } from './text.ts';

export const MAX_IMPORT_BYTES = 1024 * 1024; // 1 MB
export const EXPORT_FORMAT = 'eight-to-essentials-answers';
export const EXPORT_VERSION = 1;

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

const contextSchema = z.strictObject({
  organisationName: shortText,
  e8ReportingRequired: z.enum(['yes', 'no', 'not-sure']),
  systemsLocation: z.enum(['own-hybrid-iaas', 'saas-paas', 'not-sure']),
});

function exportFileSchema(knownIds: Set<string>) {
  return z.strictObject({
    format: z.literal(EXPORT_FORMAT),
    version: z.literal(EXPORT_VERSION),
    exportedAt: z.iso.datetime(),
    context: contextSchema,
    answers: z
      .record(z.string(), answerSchema)
      .refine((answers) => Object.keys(answers).every((id) => knownIds.has(id)), {
        message: 'Contains answers for requirements that are not in this version of the app.',
      }),
  });
}

export type ExportFile = z.infer<ReturnType<typeof exportFileSchema>>;

export function buildExport(state: AssessmentState, now: Date): ExportFile {
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: now.toISOString(),
    context: state.context,
    answers: state.answers,
  };
}

export type ImportResult = { ok: true; state: AssessmentState } | { ok: false; errors: string[] };

/**
 * Checks an imported file.
 * @param text the file's contents
 * @param sizeInBytes the file's size, checked first so a huge file is never parsed
 */
export function parseImport(
  text: string,
  sizeInBytes: number,
  requirements: E8Requirement[],
): ImportResult {
  if (sizeInBytes > MAX_IMPORT_BYTES || text.length > MAX_IMPORT_BYTES) {
    return { ok: false, errors: ['The file is larger than 1 MB.'] };
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, errors: ['The file is not valid JSON.'] };
  }
  const result = exportFileSchema(new Set(requirements.map((r) => r.id))).safeParse(json);
  if (!result.success) {
    const errors = result.error.issues
      .slice(0, 10)
      .map((i) => `${i.path.join('.') || 'File'}: ${i.message}`);
    return { ok: false, errors };
  }
  return { ok: true, state: { context: result.data.context, answers: result.data.answers } };
}

/** One row per requirement, in the data file's order. All cells are protected against formula injection. */
export function answersToCsv(state: AssessmentState, requirements: E8Requirement[]): string {
  const header = [
    'Requirement ID',
    'Strategies',
    'Maturity levels',
    'Requirement (plain English)',
    'Answer',
    'Counts as met',
    'Reason',
    'Compensating control',
    'Approved by',
    'Review date',
  ];
  const rows = requirements.map((r) => {
    const answer = state.answers[r.id];
    return [
      r.id,
      r.strategies.join('; '),
      r.levels.map((l) => `ML${l}`).join('; '),
      r.plainText,
      answer ? ANSWER_LABELS[answer.value] : 'Not answered',
      answer ? (isMet(answer) ? 'Yes' : 'No') : '',
      answer && 'reason' in answer ? answer.reason : '',
      answer?.value === 'exception' ? answer.compensatingControl : '',
      answer?.value === 'exception' ? answer.approvedBy : '',
      answer?.value === 'exception' ? answer.reviewDate : '',
    ];
  });
  const organisation = state.context.organisationName.trim();
  const title = [
    `Eight to Essentials answers${organisation ? ` for ${organisation}` : ''}. Self-assessment, not an official assessment.`,
  ];
  return toCsv([title, header, ...rows]);
}
