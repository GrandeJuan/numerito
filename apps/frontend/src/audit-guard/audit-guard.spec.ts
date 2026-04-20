import { describe, it, expect } from 'vitest';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { scanFileContent, runAuditGuard } from './run-audit-guard';
import { resolveAppRoutes } from './route-resolver';
import type { Violation, BaselineEntry } from './types';

// ── Route resolver ─────────────────────────────────────────────────────

const APP_DIR = join(__dirname, '..', 'app');

describe('resolveAppRoutes', () => {
  it('resolves known routes from app/', () => {
    const routes = resolveAppRoutes(APP_DIR);

    // Route groups are stripped — (dashboard)/clientes → /clientes
    expect(routes.has('/clientes')).toBe(true);
    expect(routes.has('/vencimientos')).toBe(true);
    expect(routes.has('/facturacion')).toBe(true);
    expect(routes.has('/tareas')).toBe(true);
    expect(routes.has('/perfil')).toBe(true);

    // Admin routes
    expect(routes.has('/admin')).toBe(true);
    expect(routes.has('/admin/estudios')).toBe(true);
    expect(routes.has('/admin/usuarios')).toBe(true);

    // Auth routes
    expect(routes.has('/login')).toBe(true);
    expect(routes.has('/forgot-password')).toBe(true);

    // Portal routes
    expect(routes.has('/portal')).toBe(true);
    expect(routes.has('/portal/documentos')).toBe(true);

    // Nested config
    expect(routes.has('/configuracion')).toBe(true);
    expect(routes.has('/configuracion/estudio')).toBe(true);
    expect(routes.has('/configuracion/usuarios')).toBe(true);
  });

  it('strips route group parentheses', () => {
    const routes = resolveAppRoutes(APP_DIR);
    // No route should contain parentheses
    for (const route of routes) {
      expect(route).not.toMatch(/\(/);
    }
  });
});

// ── Fixture-based scanner tests ────────────────────────────────────────

const FIXTURE_DIR = join(__dirname, 'fixtures');

// Minimal route set for fixture tests
const fixtureRoutes = new Set(['/clientes', '/vencimientos', '/facturacion', '/admin']);

describe('scanFileContent — good fixtures (no violations)', () => {
  const goodDir = join(FIXTURE_DIR, 'good');

  it('submit-button.tsx passes (type=submit inside form)', () => {
    const content = readFileSync(join(goodDir, 'submit-button.tsx'), 'utf-8');
    const violations = scanFileContent(content, 'good/submit-button.tsx', fixtureRoutes);
    expect(violations).toHaveLength(0);
  });

  it('real-handler.tsx passes (onClick with real logic)', () => {
    const content = readFileSync(join(goodDir, 'real-handler.tsx'), 'utf-8');
    const violations = scanFileContent(content, 'good/real-handler.tsx', fixtureRoutes);
    expect(violations).toHaveLength(0);
  });

  it('valid-link.tsx passes (href to existing route)', () => {
    const content = readFileSync(join(goodDir, 'valid-link.tsx'), 'utf-8');
    const violations = scanFileContent(content, 'good/valid-link.tsx', fixtureRoutes);
    expect(violations).toHaveLength(0);
  });

  it('external-link.tsx passes (external URL)', () => {
    const content = readFileSync(join(goodDir, 'external-link.tsx'), 'utf-8');
    const violations = scanFileContent(content, 'good/external-link.tsx', fixtureRoutes);
    expect(violations).toHaveLength(0);
  });
});

describe('scanFileContent — bad fixtures (violations detected)', () => {
  const badDir = join(FIXTURE_DIR, 'bad');

  it('console-log-handler.tsx → console-log-handler violation', () => {
    const content = readFileSync(join(badDir, 'console-log-handler.tsx'), 'utf-8');
    const violations = scanFileContent(
      content,
      'bad/console-log-handler.tsx',
      fixtureRoutes,
    );
    expect(violations.length).toBeGreaterThanOrEqual(1);
    expect(violations[0].type).toBe('console-log-handler');
    expect(violations[0].file).toBe('bad/console-log-handler.tsx');
  });

  it('empty-handler.tsx → empty-handler violation', () => {
    const content = readFileSync(join(badDir, 'empty-handler.tsx'), 'utf-8');
    const violations = scanFileContent(
      content,
      'bad/empty-handler.tsx',
      fixtureRoutes,
    );
    expect(violations.length).toBeGreaterThanOrEqual(1);
    expect(violations[0].type).toBe('empty-handler');
  });

  it('dead-href.tsx → dead-href violation', () => {
    const content = readFileSync(join(badDir, 'dead-href.tsx'), 'utf-8');
    const violations = scanFileContent(content, 'bad/dead-href.tsx', fixtureRoutes);
    expect(violations.length).toBeGreaterThanOrEqual(1);
    expect(violations[0].type).toBe('dead-href');
  });

  it('proximamente-label.tsx → proximamente-label violation', () => {
    const content = readFileSync(join(badDir, 'proximamente-label.tsx'), 'utf-8');
    const violations = scanFileContent(
      content,
      'bad/proximamente-label.tsx',
      fixtureRoutes,
    );
    expect(violations.length).toBeGreaterThanOrEqual(1);
    expect(violations[0].type).toBe('proximamente-label');
  });
});

// ── Inline scanner tests ───────────────────────────────────────────────

describe('scanFileContent — inline patterns', () => {
  it('detects onPresentar with console.log', () => {
    const code = `<VencimientosTable onPresentar={(o) => console.log('presentar', o.id)} />`;
    const v = scanFileContent(code, 'test.tsx', fixtureRoutes);
    expect(v).toHaveLength(1);
    expect(v[0].type).toBe('console-log-handler');
  });

  it('detects onClick={() => alert("TODO")}', () => {
    const code = `<button onClick={() => alert('TODO')}>Do</button>`;
    const v = scanFileContent(code, 'test.tsx', fixtureRoutes);
    expect(v).toHaveLength(1);
    expect(v[0].type).toBe('console-log-handler');
  });

  it('detects onClick={() => {}}', () => {
    const code = `<button onClick={() => {}}>Nothing</button>`;
    const v = scanFileContent(code, 'test.tsx', fixtureRoutes);
    expect(v).toHaveLength(1);
    expect(v[0].type).toBe('empty-handler');
  });

  it('does not flag onClick with real logic', () => {
    const code = `<button onClick={() => setOpen(true)}>Open</button>`;
    const v = scanFileContent(code, 'test.tsx', fixtureRoutes);
    expect(v).toHaveLength(0);
  });

  it('does not flag href to valid route', () => {
    const code = `<a href="/clientes">Clientes</a>`;
    const v = scanFileContent(code, 'test.tsx', fixtureRoutes);
    expect(v).toHaveLength(0);
  });

  it('flags href to non-existent route', () => {
    const code = `<a href="/signup">Registrate</a>`;
    const v = scanFileContent(code, 'test.tsx', fixtureRoutes);
    expect(v).toHaveLength(1);
    expect(v[0].type).toBe('dead-href');
  });

  it('does not flag external URLs', () => {
    const code = `<a href="https://google.com">Google</a>`;
    const v = scanFileContent(code, 'test.tsx', fixtureRoutes);
    expect(v).toHaveLength(0);
  });

  it('does not flag anchor-only hrefs', () => {
    const code = `<a href="#section">Go to section</a>`;
    const v = scanFileContent(code, 'test.tsx', fixtureRoutes);
    expect(v).toHaveLength(0);
  });

  it('detects "Coming soon" label', () => {
    const code = `<p>"Coming soon - stay tuned"</p>`;
    const v = scanFileContent(code, 'test.tsx', fixtureRoutes);
    expect(v).toHaveLength(1);
    expect(v[0].type).toBe('proximamente-label');
  });

  it('does not flag "próximamente" in comments', () => {
    const code = `// TODO: próximamente implementar esto`;
    const v = scanFileContent(code, 'test.tsx', fixtureRoutes);
    expect(v).toHaveLength(0);
  });
});

// ── Baseline enforcement ───────────────────────────────────────────────

const SRC_DIR = join(__dirname, '..');
const BASELINE_PATH = join(__dirname, 'audit-baseline.json');

describe('audit guard — baseline enforcement', () => {
  it('all current violations are covered by the baseline', () => {
    const report = runAuditGuard({ srcDir: SRC_DIR, appDir: APP_DIR });

    if (!existsSync(BASELINE_PATH)) {
      // If no baseline exists and there are violations, fail with instructions
      if (report.violations.length > 0) {
        throw new Error(
          `Found ${report.violations.length} violation(s) but no audit-baseline.json.\n` +
          `Run: npx vitest run src/audit-guard/audit-guard.spec.ts -- --update-baseline\n` +
          `Or create the baseline manually.\n\n` +
          `Violations:\n` +
          report.violations
            .map((v) => `  [${v.type}] ${v.file}:${v.line} — ${v.snippet.slice(0, 80)}`)
            .join('\n'),
        );
      }
      return; // No violations, no baseline needed
    }

    const baseline: BaselineEntry[] = JSON.parse(
      readFileSync(BASELINE_PATH, 'utf-8'),
    );

    const baselineSet = new Set(
      baseline.map((b) => `${b.type}::${b.file}::${b.line}`),
    );

    const newViolations = report.violations.filter(
      (v) => !baselineSet.has(`${v.type}::${v.file}::${v.line}`),
    );

    if (newViolations.length > 0) {
      const summary = newViolations
        .map(
          (v) =>
            `  [${v.type}] ${v.file}:${v.line} — ${v.snippet.slice(0, 80)}`,
        )
        .join('\n');

      throw new Error(
        `${newViolations.length} NEW violation(s) not in baseline:\n${summary}\n\n` +
        `Fix the violations or add them to audit-baseline.json if intentional.`,
      );
    }
  });

  it('baseline entries still correspond to real violations (no stale entries)', () => {
    if (!existsSync(BASELINE_PATH)) return;

    const baseline: BaselineEntry[] = JSON.parse(
      readFileSync(BASELINE_PATH, 'utf-8'),
    );

    if (baseline.length === 0) return;

    const report = runAuditGuard({ srcDir: SRC_DIR, appDir: APP_DIR });

    const violationSet = new Set(
      report.violations.map((v) => `${v.type}::${v.file}::${v.line}`),
    );

    const staleEntries = baseline.filter(
      (b) => !violationSet.has(`${b.type}::${b.file}::${b.line}`),
    );

    if (staleEntries.length > 0) {
      const summary = staleEntries
        .map(
          (s) =>
            `  [${s.type}] ${s.file}:${s.line} — ${s.snippet.slice(0, 80)}`,
        )
        .join('\n');

      throw new Error(
        `${staleEntries.length} STALE baseline entry/ies — the violation was resolved but the entry was not removed:\n${summary}\n\n` +
        `Remove resolved entries from audit-baseline.json.`,
      );
    }
  });
});
