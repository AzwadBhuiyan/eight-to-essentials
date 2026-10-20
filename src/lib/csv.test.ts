import { describe, expect, it } from 'vitest';
import { csvCell, toCsv } from './csv.ts';

describe('CSV formula injection protection', () => {
  it.each(['=1+1', '+61 400 000 000', '-2', '@SUM(A1)', '\t=cmd', '\r=cmd'])(
    'neutralises a cell starting with a formula character: %j',
    (value) => {
      expect(csvCell(value)).toBe(`"'${value}"`);
    },
  );

  it('neutralises a realistic attack payload', () => {
    expect(csvCell('=HYPERLINK("http://example.test","Click")')).toBe(
      '"\'=HYPERLINK(""http://example.test"",""Click"")"',
    );
  });

  it('leaves ordinary text alone, apart from quoting', () => {
    expect(csvCell('Swan River Analytics')).toBe('"Swan River Analytics"');
    expect(csvCell('ISM-0843')).toBe('"ISM-0843"');
  });

  it('keeps commas, quotes and line breaks inside the cell', () => {
    expect(csvCell('a, "b"\nc')).toBe('"a, ""b""\nc"');
  });

  it('writes empty cells for null and undefined', () => {
    expect(csvCell(null)).toBe('""');
    expect(csvCell(undefined)).toBe('""');
  });

  it('joins rows with Windows line endings', () => {
    expect(
      toCsv([
        ['a', 'b'],
        ['=c', 1],
      ]),
    ).toBe('"a","b"\r\n"\'=c","1"\r\n');
  });
});
