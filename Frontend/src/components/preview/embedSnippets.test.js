import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { transformSync } from 'esbuild';
import { describe, expect, it } from 'vitest';
import { DEFAULT_FRAMEWORK, FRAMEWORKS, buildSnippet, findFramework } from './embedSnippets.js';

const FORM = {
  formId: 'frm_0123456789abcdef',
  publicKey: 'pk_live_0123456789abcdef01234567',
  version: 7,
  language: 'am',
  widgetSrc: 'https://bridge.example.org/widget/v1/onboarding-widget.js',
};

/* The JavaScript inside every <script> block (not `src` ones). */
function inlineScripts(code) {
  return [...code.matchAll(/<script(?: setup)?>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
}

function hasPhp() {
  try {
    execFileSync('php', ['-v'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

describe('embed snippets', () => {
  it('offers the eight integrations, HTML first and as the default', () => {
    expect(FRAMEWORKS.map((item) => item.label)).toEqual([
      'HTML',
      'React',
      'Next.js',
      'Vue',
      'Angular',
      'Svelte',
      'WordPress',
      'PHP',
    ]);
    expect(DEFAULT_FRAMEWORK).toBe('html');
    expect(findFramework('nonsense').id).toBe('html');
  });

  for (const framework of FRAMEWORKS) {
    describe(framework.label, () => {
      const code = buildSnippet(framework.id, FORM);

      it('pins the form, key, version and language, and loads the widget', () => {
        expect(code).toContain(FORM.formId);
        expect(code).toContain(FORM.publicKey);
        expect(code).toMatch(/form-version="7"|'version' => 7/);
        expect(code).toMatch(/lang="am"|'lang' => 'am'/);
        expect(code).toContain(FORM.widgetSrc);
        expect(code).toContain('<onboarding-form');
      });

      it('receives the answers and waits for the save', () => {
        expect(code).toContain('onboarding-submit');
        expect(code).toContain('waitUntil(');
      });

      it('never carries a secret', () => {
        expect(code).not.toMatch(/sk_live|secret/i);
      });

      it('is valid code for its kind', () => {
        if (framework.kind === 'jsx') {
          expect(() => transformSync(code, { loader: 'jsx' })).not.toThrow();
        } else if (framework.kind === 'ts') {
          expect(() => transformSync(code, { loader: 'ts' })).not.toThrow();
        } else if (framework.kind !== 'php') {
          const scripts = inlineScripts(code);
          expect(scripts.length).toBeGreaterThan(0);
          for (const script of scripts) expect(() => transformSync(script, { loader: 'js' })).not.toThrow();
        }
      });
    });
  }

  it.runIf(hasPhp())('PHP: passes php -l and renders the tag with the values escaped', () => {
    const dir = mkdtempSync(join(tmpdir(), 'embed-php-'));
    const file = join(dir, 'page.php');
    writeFileSync(file, buildSnippet('php', FORM));
    expect(execFileSync('php', ['-l', file]).toString()).toMatch(/No syntax errors/);

    const html = execFileSync('php', [file]).toString();
    expect(html).toContain(`form-id="${FORM.formId}"`);
    expect(html).toContain(`public-key="${FORM.publicKey}"`);
    expect(html).toContain('form-version="7"');
    expect(html).toContain('lang="am">');
    expect(html).not.toContain('<?');
  });
});
