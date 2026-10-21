/**
 * The ASD Essentials structure and the Essential Eight to ASD Essentials mapping.
 *
 * Kept apart from index.ts on purpose: only the results, transition and report pages need this
 * data, and those pages load lazily, so it is not part of the first download.
 */
import essentialsStructureJson from './essentials-structure.json';
import e8ToEssentialsMapJson from './e8-to-essentials-map.json';
import { e8Requirements } from './index.ts';
import type { E8Requirement, E8ToEssentialsMap, EssentialsStructure } from './types.ts';

export const essentialsStructure = essentialsStructureJson as EssentialsStructure;
export const e8ToEssentialsMap = e8ToEssentialsMapJson as E8ToEssentialsMap;

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
