/**
 * Typed access to the Essential Eight data, product groups and metadata.
 * The ASD Essentials structure and mapping are in framework.ts, loaded only by the pages that need them.
 * The files are checked by `npm run validate-data` (and its tests) before every release,
 * so the app can treat them as already valid here.
 */
import e8RequirementsJson from './e8-requirements.json';
import metaJson from './meta.json';
import productGroupsJson from './product-groups.json';
import type { E8Requirement, Meta, ProductGroup } from './types.ts';

export const e8Requirements = e8RequirementsJson as E8Requirement[];
export const meta = metaJson as Meta;
export const productGroups = productGroupsJson as ProductGroup[];

/** What an imported or saved file may refer to. */
export const catalogue = {
  requirements: e8Requirements,
  productGroupIds: productGroups.map((g) => g.id),
};
