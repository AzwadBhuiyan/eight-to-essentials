/**
 * Zod setting, imported first by main.tsx.
 *
 * By default Zod 4 tries `new Function` once to see whether it can speed up validation with
 * generated code. Our Content Security Policy blocks that (no 'unsafe-eval'), so the attempt fails
 * safely but is still reported as a policy violation. "jitless" turns the check off, so the app
 * never attempts to run generated code at all.
 */
import { z } from 'zod';

z.config({ jitless: true });
