/**
 * The fictional demo company, Swan River Analytics.
 *
 * The demo is loaded through the same strict check as an imported file, so it can never contain
 * anything a user's file could not. It is kept completely separate from the user's own answers:
 * it is never saved, never merged, and is read-only in the app.
 */
import { catalogue } from '../data/index.ts';
import demoJson from '../data/demo-swan-river.json';
import type { AssessmentState } from './assessment.ts';
import { parseImport } from './importExport.ts';

export const DEMO_PROFILE = demoJson.profile;

/** Shown on every demo screen, and on the demo's exports. */
export const DEMO_LABEL = 'Fictional demo company';

function loadDemo(): AssessmentState {
  const text = JSON.stringify(demoJson.assessment);
  const result = parseImport(text, text.length, catalogue);
  if (!result.ok) {
    throw new Error(`The demo data is invalid: ${result.errors.join('; ')}`);
  }
  return result.state;
}

export const DEMO_STATE: AssessmentState = loadDemo();
