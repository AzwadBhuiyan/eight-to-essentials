/**
 * Typed access to the framework data files.
 * The files are checked by `npm run validate-data` (and its tests) before every release,
 * so the app can treat them as already valid here.
 */
import e8RequirementsJson from './e8-requirements.json';
import essentialsStructureJson from './essentials-structure.json';
import e8ToEssentialsMapJson from './e8-to-essentials-map.json';
import metaJson from './meta.json';
import type { E8Requirement, E8ToEssentialsMap, EssentialsStructure, Meta } from './types.ts';

export const e8Requirements = e8RequirementsJson as E8Requirement[];
export const essentialsStructure = essentialsStructureJson as EssentialsStructure;
export const e8ToEssentialsMap = e8ToEssentialsMapJson as E8ToEssentialsMap;
export const meta = metaJson as Meta;

/** Everything the scoring, prioritisation and transition functions need, in one object. */
export interface FrameworkData {
  requirements: E8Requirement[];
  structure: EssentialsStructure;
  map: E8ToEssentialsMap;
}

export const frameworkData: FrameworkData = {
  requirements: e8Requirements,
  structure: essentialsStructure,
  map: e8ToEssentialsMap,
};
