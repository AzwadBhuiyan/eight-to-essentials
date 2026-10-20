/**
 * CSV building with protection against spreadsheet formula injection.
 *
 * Spreadsheet apps treat a cell starting with =, +, - or @ as a formula. A malicious value
 * (for example an organisation name or exception reason typed into the app, or loaded from an
 * imported file) could then run when someone opens the CSV. Prefixing such cells with a single
 * quote makes the spreadsheet show them as plain text. Tab and carriage return are included too,
 * as OWASP recommends, because some spreadsheet apps strip them before checking.
 */

const FORMULA_START = /^[=+\-@\t\r]/;

/** Makes a value safe to place in a CSV cell. */
export function csvCell(value: string | number | boolean | null | undefined): string {
  let text = value === null || value === undefined ? '' : String(value);
  if (FORMULA_START.test(text)) text = `'${text}`;
  // Every cell is quoted, and quotes inside are doubled, so commas and line breaks stay in the cell.
  return `"${text.replace(/"/g, '""')}"`;
}

/** Builds a CSV document from a header row and data rows, with Windows line endings for Excel. */
export function toCsv(rows: (string | number | boolean | null | undefined)[][]): string {
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
