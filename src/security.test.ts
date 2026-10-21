/// <reference types="node" />
/**
 * Security checks that should never regress.
 * Import validation, CSV formula injection and storage failures have their own detailed tests in
 * importExport.test.ts, csv.test.ts, resultsCsv.test.ts and storage.test.ts.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { CONTENT_SECURITY_POLICY } from '../vite.config.ts';
import './lib/zodConfig.ts';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

/** Removes comments, so explanations of what the code avoids are not mistaken for code. */
function withoutComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

// App code only: tests and the test setup are left out.
const files = sourceFiles('src')
  .filter((path) => !path.startsWith(join('src', 'test')))
  .map((path) => ({ path, text: withoutComments(readFileSync(path, 'utf8')) }));

describe('Content Security Policy', () => {
  it('only allows the site itself, with no unsafe exceptions', () => {
    expect(CONTENT_SECURITY_POLICY).toContain("default-src 'self'");
    expect(CONTENT_SECURITY_POLICY).toContain("script-src 'self'");
    expect(CONTENT_SECURITY_POLICY).toContain("style-src 'self'");
    expect(CONTENT_SECURITY_POLICY).toContain("object-src 'none'");
    expect(CONTENT_SECURITY_POLICY).toContain("base-uri 'none'");
    expect(CONTENT_SECURITY_POLICY).not.toMatch(/unsafe-|https?:|\*|data:|blob:/);
  });

  it("turns off Zod's generated-code check, so the policy is never triggered", () => {
    expect(z.config().jitless).toBe(true);
  });
});

describe('source code', () => {
  it('never writes raw HTML or runs generated code', () => {
    for (const { path, text } of files) {
      expect(text, path).not.toMatch(
        /dangerouslySetInnerHTML|\.innerHTML|\.outerHTML\s*=|document\.write|\beval\(|new Function/,
      );
    }
  });

  it('never uses inline style attributes, which the policy would block', () => {
    for (const { path, text } of files) {
      expect(text, path).not.toMatch(/style=\{\{|setAttribute\(\s*['"]style/);
    }
  });

  it('only touches browser storage in storage.ts, inside try/catch', () => {
    const users = files.filter((f) => /localStorage|sessionStorage|indexedDB/.test(f.text));
    expect(users.map((f) => f.path)).toEqual([join('src', 'lib', 'storage.ts')]);
    const storage = users[0]!.text;
    // Every exported function that touches storage wraps its body in try/catch.
    for (const fn of ['saveState', 'loadState', 'clearSavedState', 'browserStore']) {
      const body = storage.slice(storage.indexOf(`function ${fn}`));
      expect(body.slice(0, body.indexOf('\n}')), fn).toContain('try {');
    }
  });

  it('makes no network requests and loads nothing from other websites', () => {
    for (const { path, text } of files) {
      expect(text, path).not.toMatch(/\bfetch\(|XMLHttpRequest|WebSocket|navigator\.sendBeacon/);
    }
    const html = readFileSync('index.html', 'utf8');
    expect(html).not.toMatch(/<script[^>]+src=["']https?:|<link[^>]+href=["']https?:/);
  });
});

describe('page metadata', () => {
  const html = readFileSync('index.html', 'utf8');

  it('has the favicon and a social preview card with absolute URLs', () => {
    expect(html).toContain('<link rel="icon" type="image/svg+xml" href="/favicon.svg" />');
    expect(html).toMatch(
      /property="og:image"\s+content="https:\/\/azwadbhuiyan\.github\.io\/eight-to-essentials\/og-image\.png"/,
    );
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain('<meta name="author" content="Azwad Bhuiyan" />');
  });

  it('ships the favicon and the 1200 × 630 preview image', () => {
    const png = readFileSync(join('public', 'og-image.png'));
    // A PNG stores its width and height as big-endian numbers at bytes 16 and 20.
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
    expect(readFileSync(join('public', 'favicon.svg'), 'utf8')).toContain('<svg');
  });
});

describe('GitHub workflows', () => {
  const workflowDir = join('.github', 'workflows');
  const workflows = readdirSync(workflowDir)
    .filter((f) => /\.ya?ml$/.test(f))
    .map((f) => ({ name: f, text: readFileSync(join(workflowDir, f), 'utf8') }));

  it('exist', () => {
    expect(workflows.map((w) => w.name)).toContain('codeql.yml');
  });

  it('pin every action to a full commit SHA, with its version noted', () => {
    for (const { name, text } of workflows) {
      const uses = text.match(/uses:\s*\S+/g) ?? [];
      expect(uses.length, name).toBeGreaterThan(0);
      for (const line of text.split('\n').filter((l) => /^\s*(-\s*)?uses:/.test(l))) {
        expect(line, name).toMatch(/uses:\s*[\w./-]+@[0-9a-f]{40}\s+#\s*v\d/);
      }
    }
  });

  it('start with no permissions and grant only what each job needs', () => {
    for (const { name, text } of workflows) {
      expect(text, name).toMatch(/^permissions: \{\}$/m);
      expect(text, name).not.toMatch(/write-all|read-all/);
    }
  });

  it('do not keep the checkout credentials', () => {
    for (const { name, text } of workflows) {
      if (text.includes('actions/checkout@'))
        expect(text, name).toContain('persist-credentials: false');
    }
  });
});
