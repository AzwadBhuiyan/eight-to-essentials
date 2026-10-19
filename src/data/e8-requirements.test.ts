import { describe, expect, it } from 'vitest';
import data from './e8-requirements.json';
import { STRATEGIES, type E8Requirement, type MaturityLevel, type Strategy } from './types.ts';

const requirements = data as E8Requirement[];

// Number of requirements listed for each strategy at each level in Appendices A to C
// of the Essential Eight maturity model (November 2023). Shared controls count once
// under every strategy they appear in.
const EXPECTED_COUNTS: Record<Strategy, [number, number, number]> = {
  'Patch applications': [9, 11, 13],
  'Patch operating systems': [8, 8, 16],
  'Multi-factor authentication': [7, 19, 23],
  'Restrict administrative privileges': [7, 20, 29],
  'Application control': [3, 14, 19],
  'Restrict Microsoft Office macros': [4, 5, 11],
  'User application hardening': [4, 22, 27],
  'Regular backups': [6, 8, 11],
};

describe('e8-requirements.json', () => {
  it('has 126 requirements with unique IDs', () => {
    expect(requirements).toHaveLength(126);
    expect(new Set(requirements.map((r) => r.id)).size).toBe(126);
  });

  it('uses 113 ISM IDs and 13 local IDs in the right formats', () => {
    const ism = requirements.filter((r) => r.idSource === 'ism');
    const local = requirements.filter((r) => r.idSource === 'local');
    expect(ism).toHaveLength(113);
    expect(local).toHaveLength(13);
    ism.forEach((r) => expect(r.id).toMatch(/^ISM-\d{4}$/));
    local.forEach((r) => expect(r.id).toMatch(/^E8MM-2023-\d{2}$/));
    expect(local.map((r) => r.id).sort()).toEqual(
      Array.from({ length: 13 }, (_, i) => `E8MM-2023-${String(i + 1).padStart(2, '0')}`),
    );
  });

  it.each(STRATEGIES)('matches the maturity model counts for %s', (strategy) => {
    const count = (level: MaturityLevel) =>
      requirements.filter((r) => r.strategies.includes(strategy) && r.levels.includes(level))
        .length;
    expect([count(1), count(2), count(3)]).toEqual(EXPECTED_COUNTS[strategy]);
  });

  it('only uses known strategies, levels, effort and exposure values', () => {
    for (const r of requirements) {
      expect(r.strategies.length).toBeGreaterThan(0);
      r.strategies.forEach((s) => expect(STRATEGIES).toContain(s));
      expect(r.levels.length).toBeGreaterThan(0);
      r.levels.forEach((l) => expect([1, 2, 3]).toContain(l));
      expect(['quick-win', 'moderate', 'project']).toContain(r.effort);
      expect(['boundary', 'identity', 'other']).toContain(r.exposure);
    }
  });

  it('has the content every question needs', () => {
    for (const r of requirements) {
      expect(r.plainText.trim(), r.id).not.toBe('');
      expect(r.whyItMatters.trim(), r.id).not.toBe('');
      expect(r.evidence.length, r.id).toBeGreaterThan(0);
    }
  });

  it('gives "Does not apply" guidance exactly when it is allowed', () => {
    for (const r of requirements) {
      if (r.naAllowed) expect(r.naGuidance, r.id).toBeTruthy();
      else expect(r.naGuidance, r.id).toBeNull();
    }
  });

  it('allows "Does not apply" only on the 43 requirements approved in review', () => {
    expect(requirements.filter((r) => r.naAllowed)).toHaveLength(43);
    // Almost every organisation has these; real exceptions use the exception route.
    for (const id of [
      'ISM-1505',
      'ISM-1894',
      'ISM-1859',
      'ISM-1823',
      'ISM-1670',
      'ISM-1860',
      'ISM-1824',
    ]) {
      expect(requirements.find((r) => r.id === id)?.naAllowed, id).toBe(false);
    }
  });

  it('shows helper text only where it was added in review', () => {
    const withHelp = requirements.filter((r) => r.helpText !== null).map((r) => r.id);
    expect(withHelp.sort()).toEqual(['E8MM-2023-03', 'ISM-1694', 'ISM-1701', 'ISM-1877']);
    for (const r of requirements) {
      if (r.helpText !== null) expect(r.helpText.trim(), r.id).not.toBe('');
    }
  });

  it('words every "patches, updates or other vendor mitigations" requirement the same way', () => {
    // The requirements where the maturity model says "Patches, updates or other vendor mitigations".
    const vendorMitigationIds = [
      // Patch applications
      'ISM-1876',
      'ISM-1690',
      'ISM-1691',
      'ISM-1693',
      'ISM-1692',
      'ISM-1901',
      // Patch operating systems
      'ISM-1877',
      'ISM-1694',
      'ISM-1695',
      'ISM-1696',
      'ISM-1902',
      'ISM-1879',
      'ISM-1697',
      'ISM-1903',
      'ISM-1904',
    ];
    for (const id of vendorMitigationIds) {
      expect(requirements.find((r) => r.id === id)?.plainText, id).toMatch(
        /^Patches, updates or other vendor fixes \(such as workarounds\) for /,
      );
    }
    for (const r of requirements) {
      expect(r.plainText, r.id).not.toContain('vendor workarounds');
    }
  });

  it('cites one maturity model location per level, and an ID source for ISM IDs only', () => {
    for (const r of requirements) {
      expect(r.source.locations, r.id).toHaveLength(r.levels.length);
      expect(r.source.ismId !== null, r.id).toBe(r.idSource === 'ism');
      expect(r.source.essentialsActions !== null, r.id).toBe(r.essentialsActions.length > 0);
    }
  });

  it('lists shared controls under every strategy they belong to', () => {
    const byId = new Map(requirements.map((r) => [r.id, r]));
    // Event logs protected: shared by four strategies in the maturity model.
    expect(byId.get('ISM-1815')?.strategies).toEqual([
      'Multi-factor authentication',
      'Restrict administrative privileges',
      'Application control',
      'User application hardening',
    ]);
    // Asset discovery: shared by both patching strategies.
    expect(byId.get('ISM-1807')?.strategies).toEqual([
      'Patch applications',
      'Patch operating systems',
    ]);
  });
});
