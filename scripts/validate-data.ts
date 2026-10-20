/**
 * Checks the framework data files in src/data for missing fields, duplicate IDs,
 * broken references between files and unknown strategy or domain names.
 * Run with: npm run validate-data
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validateData } from '../src/data/validate.ts';

const dataDir = new URL('../src/data/', import.meta.url);
const read = (name: string): unknown =>
  JSON.parse(readFileSync(fileURLToPath(new URL(name, dataDir)), 'utf8'));

const errors = validateData({
  e8Requirements: read('e8-requirements.json'),
  essentialsStructure: read('essentials-structure.json'),
  e8ToEssentialsMap: read('e8-to-essentials-map.json'),
  meta: read('meta.json'),
  productGroups: read('product-groups.json'),
});

if (errors.length > 0) {
  console.error(`Data validation failed with ${errors.length} error(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('Data validation passed.');
