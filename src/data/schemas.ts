/**
 * Zod schemas for the framework data files.
 * Every object is strict: an unknown or misspelt field is an error, not silently ignored.
 */
import { z } from 'zod';
import {
  DOMAINS,
  STRATEGIES,
  type E8Requirement,
  type E8ToEssentialsMap,
  type EssentialsStructure,
  type Meta,
  type ProductGroup,
} from './types.ts';

const text = z.string().trim().min(1);
const strategy = z.enum(STRATEGIES);
const domain = z.enum(DOMAINS);
const level = z.union([z.literal(1), z.literal(2), z.literal(3)]);
const principleId = z.string().regex(/^[A-Z]{3}-\d{2}$/);
const actionId = z.string().regex(/^IT\.[A-Z]{3}-\d{2}\.\d+$/);
const e8Id = z.string().regex(/^(ISM-\d{4}|E8MM-2023-\d{2})$/);
const isoDate = z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/);

const sourceRef = z.strictObject({ document: text, url: z.url(), location: text });

export const e8RequirementSchema = z.strictObject({
  id: e8Id,
  idSource: z.enum(['ism', 'local']),
  strategies: z.array(strategy).min(1),
  levels: z.array(level).min(1),
  plainText: text,
  conditions: z.array(text),
  helpText: text.nullable(),
  whyItMatters: text,
  evidence: z.array(text).min(1),
  effort: z.enum(['quick-win', 'moderate', 'project']),
  exposure: z.enum(['boundary', 'identity', 'other']),
  naAllowed: z.boolean(),
  naGuidance: text.nullable(),
  naGroup: z
    .string()
    .regex(/^[a-z-]+$/)
    .nullable(),
  essentialsActions: z.array(actionId),
  source: z.strictObject({
    document: text,
    url: z.url(),
    locations: z.array(text).min(1),
    ismId: sourceRef.nullable(),
    essentialsActions: sourceRef.nullable(),
  }),
});
export const e8RequirementsSchema = z.array(e8RequirementSchema);

export const essentialsStructureSchema = z.strictObject({
  domains: z.array(
    z.strictObject({
      name: domain,
      kind: z.enum(['capability', 'technical']),
      priorityPhase: z.union([z.literal('all'), level]),
      description: text,
      applicablePrincipleCount: z.int().positive(),
      applicableActionCount: z.int().positive(),
      source: sourceRef,
    }),
  ),
  principles: z.array(
    z.strictObject({
      id: principleId,
      title: text,
      domains: z.array(domain).min(1),
      source: sourceRef,
    }),
  ),
  actions: z.array(
    z.strictObject({
      id: actionId,
      principleId,
      summary: text,
      domains: z.array(domain).min(1),
      e8Controls: z.array(e8Id),
      unmatchedE8References: z.array(z.string().regex(/^ISM-\d{4}$/)),
      hasE8Equivalent: z.boolean(),
      source: z.strictObject({
        action: sourceRef,
        applicability: sourceRef,
        e8References: sourceRef,
      }),
    }),
  ),
});

const strengthenPoint = z.strictObject({ topic: text, text });

export const e8ToEssentialsMapSchema = z.strictObject({
  strategies: z.array(
    z.strictObject({
      strategy,
      table2Principles: z.array(principleId).min(1),
      sectionPrinciples: z.array(principleId).min(1),
      principlesWithoutActionMapping: z.array(principleId),
      source: sourceRef,
    }),
  ),
  mappings: z.array(
    z.strictObject({
      id: z.string().regex(/^T\d-\d{2}$/),
      strategies: z.array(strategy).min(1),
      actionId,
      principleId,
      domain,
      contributingLevel: level,
      contribution: z.enum(['full', 'partial']),
      strengthenNote: text,
      excluded: z.boolean(),
      excludedReason: text.nullable(),
      source: sourceRef,
    }),
  ),
  strengthen: z.array(
    z.strictObject({
      strategies: z.array(strategy).min(1),
      points: z.array(strengthenPoint).min(1),
      source: sourceRef,
    }),
  ),
  eventLoggingDetectionAndResponse: z.strictObject({
    principles: z.array(principleId).min(1),
    strengthen: z.array(strengthenPoint).min(1),
    source: sourceRef,
  }),
});

export const productGroupsSchema = z.array(
  z.strictObject({
    id: z.string().regex(/^[a-z-]+$/),
    label: text,
    description: text,
    helpText: text.nullable(),
    source: sourceRef,
  }),
);

export const metaSchema = z.strictObject({
  dataCheckedOn: isoDate,
  frameworks: z.array(
    z.strictObject({
      id: text,
      name: text,
      version: text,
      firstPublished: isoDate.optional(),
      lastUpdated: isoDate.optional(),
      published: isoDate.optional(),
      url: z.url(),
      note: text,
    }),
  ),
  documents: z.array(z.strictObject({ name: text, url: z.url() })).min(1),
  licence: z.strictObject({ name: text, url: z.url(), attribution: text, exclusions: text }),
});

// Compile-time check that each schema and its TypeScript type describe exactly the same shape.
// If either side changes without the other, `npm run typecheck` fails here.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const schemasMatchTypes: [
  Same<z.infer<typeof e8RequirementSchema>, E8Requirement>,
  Same<z.infer<typeof essentialsStructureSchema>, EssentialsStructure>,
  Same<z.infer<typeof e8ToEssentialsMapSchema>, E8ToEssentialsMap>,
  Same<z.infer<typeof metaSchema>, Meta>,
  Same<z.infer<typeof productGroupsSchema>, ProductGroup[]>,
] = [true, true, true, true, true];
void schemasMatchTypes;
