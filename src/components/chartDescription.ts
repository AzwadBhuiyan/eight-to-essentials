import { LEVEL_NAMES } from '../lib/text.ts';
import type { E8Result } from '../lib/types.ts';

/** The text alternative for the radar chart, read by screen readers instead of the picture. */
export function chartDescription(e8: E8Result): string {
  const summary = e8.strategies
    .map((s) => `${s.strategy}: ${s.level === null ? 'incomplete' : LEVEL_NAMES[s.level]}`)
    .join('; ');
  return `Radar chart of Essential Eight maturity by strategy, against a target of ${LEVEL_NAMES[e8.target]}. ${summary}.`;
}

/**
 * Splits a strategy name into short lines, so the chart's labels fit on a phone screen
 * instead of being cut off (for example "Patch operating" / "systems").
 */
export function wrapLabel(text: string, maxLine = 12): string[] {
  const lines: string[] = [];
  for (const word of text.split(' ')) {
    const last = lines[lines.length - 1];
    if (last !== undefined && `${last} ${word}`.length <= maxLine)
      lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines;
}
