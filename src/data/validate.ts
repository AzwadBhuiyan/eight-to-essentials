/**
 * Validates the framework data files: shape (via Zod) and cross-references between files.
 * Pure function with no file access, so it can run in tests and in scripts/validate-data.ts.
 */
import type { z } from 'zod';
import {
  e8RequirementsSchema,
  e8ToEssentialsMapSchema,
  essentialsStructureSchema,
  metaSchema,
  productGroupsSchema,
} from './schemas.ts';
import { DOMAINS, STRATEGIES, type Domain } from './types.ts';

export interface DataFiles {
  e8Requirements: unknown;
  essentialsStructure: unknown;
  e8ToEssentialsMap: unknown;
  meta: unknown;
  productGroups: unknown;
}

/**
 * Applicable principles per domain and totals, from the Assessment Workbook.
 * These are fixed facts about ASD's framework, so the data must match them exactly.
 */
export const EXPECTED_PRINCIPLES_PER_DOMAIN: Record<Domain, number> = {
  'Governance and culture': 7,
  'Visibility and response': 10,
  'Boundary services': 16,
  'Identity services': 16,
  'Critical processes and services': 16,
  'Privileged environments': 16,
  'Business systems': 13,
  'User devices': 10,
};
export const EXPECTED_PRINCIPLES = 28;
export const EXPECTED_ACTIONS = 58;

function schemaErrors(file: string, result: z.ZodSafeParseResult<unknown>): string[] {
  if (result.success) return [];
  return result.error.issues.map((i) => `${file}: ${i.path.join('.') || '(root)'}: ${i.message}`);
}

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const v of values) (seen.has(v) ? dupes : seen).add(v);
  return [...dupes];
}

export function validateData(files: DataFiles): string[] {
  const reqResult = e8RequirementsSchema.safeParse(files.e8Requirements);
  const structResult = essentialsStructureSchema.safeParse(files.essentialsStructure);
  const mapResult = e8ToEssentialsMapSchema.safeParse(files.e8ToEssentialsMap);
  const metaResult = metaSchema.safeParse(files.meta);
  const groupsResult = productGroupsSchema.safeParse(files.productGroups);

  const errors = [
    ...schemaErrors('e8-requirements.json', reqResult),
    ...schemaErrors('essentials-structure.json', structResult),
    ...schemaErrors('e8-to-essentials-map.json', mapResult),
    ...schemaErrors('meta.json', metaResult),
    ...schemaErrors('product-groups.json', groupsResult),
  ];
  // Cross-reference checks need well-formed data, so stop here if any shape is wrong.
  if (
    !reqResult.success ||
    !structResult.success ||
    !mapResult.success ||
    !metaResult.success ||
    !groupsResult.success
  ) {
    return errors;
  }

  const reqs = reqResult.data;
  const { domains, principles, actions } = structResult.data;
  const map = mapResult.data;
  const err = (msg: string) => errors.push(msg);

  // ---- duplicate IDs
  const dupeChecks: [string, string[]][] = [
    ['requirement ID', reqs.map((r) => r.id)],
    ['domain name', domains.map((d) => d.name)],
    ['principle ID', principles.map((p) => p.id)],
    ['action ID', actions.map((a) => a.id)],
    ['mapping row ID', map.mappings.map((m) => m.id)],
    ['strategy entry', map.strategies.map((s) => s.strategy)],
    ['product group ID', groupsResult.data.map((g) => g.id)],
  ];
  for (const [label, values] of dupeChecks) {
    for (const d of duplicates(values)) err(`Duplicate ${label}: ${d}`);
  }

  const reqById = new Map(reqs.map((r) => [r.id, r]));
  const principleIds = new Set(principles.map((p) => p.id));
  const actionById = new Map(actions.map((a) => [a.id, a]));

  // ---- e8-requirements.json
  for (const r of reqs) {
    const localId = r.id.startsWith('E8MM-');
    if (localId !== (r.idSource === 'local')) err(`${r.id}: idSource does not match ID format`);
    if (r.naAllowed !== (r.naGuidance !== null))
      err(`${r.id}: naGuidance must be set exactly when naAllowed is true`);
    if (r.source.locations.length !== r.levels.length)
      err(`${r.id}: needs one source location per level`);
    for (const aid of r.essentialsActions) {
      const action = actionById.get(aid);
      if (!action) err(`${r.id}: unknown Essentials action ${aid}`);
      else if (!action.e8Controls.includes(r.id))
        err(`${r.id}: links to ${aid}, but ${aid} does not list ${r.id}`);
    }
  }

  // ---- essentials-structure.json
  if (domains.length !== DOMAINS.length) err(`Expected ${DOMAINS.length} domains`);
  if (principles.length !== EXPECTED_PRINCIPLES)
    err(`Expected ${EXPECTED_PRINCIPLES} principles, found ${principles.length}`);
  if (actions.length !== EXPECTED_ACTIONS)
    err(`Expected ${EXPECTED_ACTIONS} actions, found ${actions.length}`);

  for (const a of actions) {
    if (!principleIds.has(a.principleId)) err(`${a.id}: unknown principle ${a.principleId}`);
    if (!a.id.startsWith(`IT.${a.principleId}.`))
      err(`${a.id}: ID does not match principle ${a.principleId}`);
    for (const c of a.e8Controls) {
      const req = reqById.get(c);
      if (!req) err(`${a.id}: unknown E8 requirement ${c}`);
      else if (!req.essentialsActions.includes(a.id))
        err(`${a.id}: lists ${c}, but ${c} does not link back`);
    }
    for (const u of a.unmatchedE8References) {
      if (reqById.has(u)) err(`${a.id}: ${u} is listed as unmatched but exists as a requirement`);
    }
  }

  for (const d of domains) {
    const inDomain = actions.filter((a) => a.domains.includes(d.name));
    const principleCount = new Set(inDomain.map((a) => a.principleId)).size;
    if (principleCount !== d.applicablePrincipleCount)
      err(`${d.name}: applicablePrincipleCount does not match the actions`);
    if (inDomain.length !== d.applicableActionCount)
      err(`${d.name}: applicableActionCount does not match the actions`);
    if (d.applicablePrincipleCount !== EXPECTED_PRINCIPLES_PER_DOMAIN[d.name])
      err(
        `${d.name}: expected ${EXPECTED_PRINCIPLES_PER_DOMAIN[d.name]} principles (Assessment Workbook), found ${d.applicablePrincipleCount}`,
      );
    const expectedKind = d.priorityPhase === 'all' ? 'capability' : 'technical';
    if (d.kind !== expectedKind) err(`${d.name}: kind does not match priority phase`);
  }

  for (const p of principles) {
    const fromActions = new Set(
      actions.filter((a) => a.principleId === p.id).flatMap((a) => a.domains),
    );
    if (fromActions.size !== p.domains.length || p.domains.some((d) => !fromActions.has(d)))
      err(`${p.id}: domains do not match its actions`);
  }

  // ---- product-groups.json: every group has members, and only "Does not apply" requirements join one.
  const groupIds = new Set(groupsResult.data.map((g) => g.id));
  for (const r of reqs) {
    if (r.naGroup === null) continue;
    if (!r.naAllowed) err(`${r.id}: in product group ${r.naGroup} but naAllowed is false`);
    if (!groupIds.has(r.naGroup)) err(`${r.id}: unknown product group ${r.naGroup}`);
  }
  for (const g of groupsResult.data) {
    if (!reqs.some((r) => r.naGroup === g.id)) err(`Product group ${g.id} has no requirements`);
  }

  // ---- e8-to-essentials-map.json
  const strategyEntries = new Set(map.strategies.map((s) => s.strategy));
  for (const s of STRATEGIES) if (!strategyEntries.has(s)) err(`Map is missing strategy ${s}`);

  for (const m of map.mappings) {
    const action = actionById.get(m.actionId);
    if (!action) {
      err(`${m.id}: unknown action ${m.actionId}`);
      continue;
    }
    if (action.principleId !== m.principleId)
      err(`${m.id}: principle ${m.principleId} does not match action ${m.actionId}`);
    if (m.excluded !== (m.excludedReason !== null))
      err(`${m.id}: excludedReason must be set exactly when excluded is true`);
    // Excluded rows are kept for traceability even though ASD's other documents say the
    // action does not apply in that domain. Every other row must use an applicable domain.
    if (!m.excluded && !action.domains.includes(m.domain))
      err(`${m.id}: ${m.actionId} does not apply in ${m.domain}`);
  }

  for (const s of map.strategies) {
    const listed = [...new Set([...s.table2Principles, ...s.sectionPrinciples])];
    for (const p of listed) if (!principleIds.has(p)) err(`${s.strategy}: unknown principle ${p}`);
    const withRows = new Set(
      map.mappings
        .filter((m) => !m.excluded && m.strategies.includes(s.strategy))
        .map((m) => m.principleId),
    );
    const expected = listed.filter((p) => !withRows.has(p));
    if (expected.join() !== s.principlesWithoutActionMapping.join())
      err(`${s.strategy}: principlesWithoutActionMapping should be [${expected.join(', ')}]`);
  }

  for (const p of map.eventLoggingDetectionAndResponse.principles) {
    if (!principleIds.has(p)) err(`Event logging section: unknown principle ${p}`);
  }

  // "Not covered by the Essential Eight" (methodology D12): no E8 controls cited and no valid mapping row.
  const mappedActions = new Set(map.mappings.filter((m) => !m.excluded).map((m) => m.actionId));
  for (const a of actions) {
    const expected =
      a.e8Controls.length > 0 || a.unmatchedE8References.length > 0 || mappedActions.has(a.id);
    if (a.hasE8Equivalent !== expected)
      err(`${a.id}: hasE8Equivalent should be ${expected} (methodology D12)`);
  }

  return errors;
}
