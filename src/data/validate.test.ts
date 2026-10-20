import { describe, expect, it } from 'vitest';
import e8Requirements from './e8-requirements.json';
import essentialsStructure from './essentials-structure.json';
import e8ToEssentialsMap from './e8-to-essentials-map.json';
import meta from './meta.json';
import productGroups from './product-groups.json';
import { EXPECTED_PRINCIPLES_PER_DOMAIN, validateData, type DataFiles } from './validate.ts';
import type { E8ToEssentialsMap, EssentialsStructure } from './types.ts';

const realData: DataFiles = {
  e8Requirements,
  essentialsStructure,
  e8ToEssentialsMap,
  meta,
  productGroups,
};
const structure = essentialsStructure as EssentialsStructure;
const map = e8ToEssentialsMap as E8ToEssentialsMap;

/** A deep copy of the real data that a test can break on purpose. */
function copy() {
  return structuredClone(realData) as {
    e8Requirements: Record<string, unknown>[];
    essentialsStructure: Record<string, Record<string, unknown>[]>;
    e8ToEssentialsMap: Record<string, Record<string, unknown>[]>;
    meta: Record<string, unknown>;
    productGroups: Record<string, unknown>[];
  };
}

describe('validateData with the real data files', () => {
  it('finds no errors', () => {
    expect(validateData(realData)).toEqual([]);
  });

  it('has 28 principles and 58 actions', () => {
    expect(structure.principles).toHaveLength(28);
    expect(structure.actions).toHaveLength(58);
  });

  it('matches the Assessment Workbook principle counts for each domain', () => {
    const counts = Object.fromEntries(
      structure.domains.map((d) => [d.name, d.applicablePrincipleCount]),
    );
    expect(counts).toEqual(EXPECTED_PRINCIPLES_PER_DOMAIN);
    expect(Object.values(counts)).toEqual([7, 10, 16, 16, 16, 16, 13, 10]);
  });

  it('lists exactly 22 actions as not covered by the Essential Eight (methodology D12)', () => {
    const notCovered = structure.actions.filter((a) => !a.hasE8Equivalent).map((a) => a.id);
    expect(notCovered).toHaveLength(22);
    // Mapped in Transitioning from the Essential Eight, Table 4, so it is covered.
    expect(notCovered).not.toContain('IT.IDE-01.2');
    // Its only mapping row is excluded (methodology D11), so it is not covered.
    expect(notCovered).toContain('IT.PRO-09.2');
  });

  it('excludes only the Table 8 row for PRO-09.2 in User devices', () => {
    const excluded = map.mappings.filter((m) => m.excluded);
    expect(excluded).toHaveLength(1);
    expect(excluded[0]).toMatchObject({ actionId: 'IT.PRO-09.2', domain: 'User devices' });
  });

  it('keeps both Table 7 rows for PRO-07.1 in User devices (methodology D15)', () => {
    const rows = map.mappings.filter(
      (m) =>
        m.actionId === 'IT.PRO-07.1' &&
        m.domain === 'User devices' &&
        m.strategies.includes('Restrict Microsoft Office macros'),
    );
    expect(rows.map((m) => [m.contributingLevel, m.contribution])).toEqual([
      [1, 'partial'],
      [3, 'full'],
    ]);
  });

  it('applies Table 4 rows to both patching strategies (methodology D9)', () => {
    for (const m of map.mappings.filter((x) => x.source.location.startsWith('Table 4'))) {
      expect(m.strategies).toEqual(['Patch applications', 'Patch operating systems']);
    }
  });
});

describe('validateData catches broken data', () => {
  it('rejects an unknown field', () => {
    const data = copy();
    data.e8Requirements[0]!.extra = 'not allowed';
    expect(validateData(data).join()).toMatch(/e8-requirements\.json: 0:.*extra/i);
  });

  it('rejects a missing required field', () => {
    const data = copy();
    delete data.e8Requirements[0]!.whyItMatters;
    expect(validateData(data).join()).toMatch(/0\.whyItMatters/);
  });

  it('rejects an unknown strategy name', () => {
    const data = copy();
    data.e8Requirements[0]!.strategies = ['Patch everything'];
    expect(validateData(data).join()).toMatch(/0\.strategies\.0/);
  });

  it('rejects an unknown domain name', () => {
    const data = copy();
    data.e8ToEssentialsMap.mappings![0]!.domain = 'Mobile devices';
    expect(validateData(data).join()).toMatch(/mappings\.0\.domain/);
  });

  it('reports duplicate IDs', () => {
    const data = copy();
    data.e8Requirements[1]!.id = data.e8Requirements[0]!.id;
    expect(validateData(data)).toContain(`Duplicate requirement ID: ${data.e8Requirements[0]!.id}`);
  });

  it('reports a mapping row that points to an unknown action', () => {
    const data = copy();
    data.e8ToEssentialsMap.mappings![0]!.actionId = 'IT.PRO-99.1';
    expect(validateData(data).join()).toMatch(/unknown action IT\.PRO-99\.1/);
  });

  it('reports a mapping row in a domain where the action does not apply', () => {
    const data = copy();
    const row = data.e8ToEssentialsMap.mappings!.find((m) => m.actionId === 'IT.PRO-05.1')!;
    row.domain = 'User devices';
    expect(validateData(data).join()).toMatch(/IT\.PRO-05\.1 does not apply in User devices/);
  });

  it('reports a link that only goes one way', () => {
    const data = copy();
    const req = data.e8Requirements.find((r) => r.id === 'ISM-0843')!;
    req.essentialsActions = ['IT.PRO-07.1', 'IT.PRO-01.1'];
    expect(validateData(data)).toContain(
      'ISM-0843: links to IT.PRO-01.1, but IT.PRO-01.1 does not list ISM-0843',
    );
  });

  it('reports a product group member that does not allow "Does not apply"', () => {
    const data = copy();
    data.e8Requirements.find((r) => r.id === 'ISM-0843')!.naGroup = 'microsoft-office';
    expect(validateData(data)).toContain(
      'ISM-0843: in product group microsoft-office but naAllowed is false',
    );
  });

  it('reports an unknown product group', () => {
    const data = copy();
    data.e8Requirements.find((r) => r.id === 'ISM-1671')!.naGroup = 'no-such-group';
    expect(validateData(data)).toContain('ISM-1671: unknown product group no-such-group');
  });

  it('reports principle counts that no longer match the workbook', () => {
    const data = copy();
    // IDE-01.2 is the only Asset identification action in User devices, so removing that
    // domain from it drops User devices from 10 principles to 9.
    const action = data.essentialsStructure.actions!.find((a) => a.id === 'IT.IDE-01.2')!;
    action.domains = (action.domains as string[]).filter((d) => d !== 'User devices');
    expect(validateData(data).join()).toMatch(/User devices: applicablePrincipleCount/);
  });
});
