/**
 * Typed access to the framework data files.
 * The files are checked by `npm run validate-data` (and its tests) before every release,
 * so the app can treat them as already valid here.
 */
import e8RequirementsJson from './e8-requirements.json';
import essentialsStructureJson from './essentials-structure.json';
import e8ToEssentialsMapJson from './e8-to-essentials-map.json';
import metaJson from './meta.json';
import productGroupsJson from './product-groups.json';
import type {
  E8Requirement,
  E8ToEssentialsMap,
  EssentialsStructure,
  Meta,
  ProductGroup,
} from './types.ts';

export const e8Requirements = e8RequirementsJson as E8Requirement[];
export const essentialsStructure = essentialsStructureJson as EssentialsStructure;
export const e8ToEssentialsMap = e8ToEssentialsMapJson as E8ToEssentialsMap;
export const meta = metaJson as Meta;
export const productGroups = productGroupsJson as ProductGroup[];

/** Everything the scoring, prioritisation and transition functions need, in one object. */
export interface FrameworkData {
  requirements: E8Requirement[];
  structure: EssentialsStructure;
  map: E8ToEssentialsMap;
}

/** What an imported or saved file may refer to. */
export const catalogue = {
  requirements: e8Requirements,
  productGroupIds: productGroups.map((g) => g.id),
};

export const frameworkData: FrameworkData = {
  requirements: e8Requirements,
  structure: essentialsStructure,
  map: e8ToEssentialsMap,
};
