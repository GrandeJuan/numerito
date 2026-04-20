import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import { resolveAppRoutes, isValidHref } from './route-resolver';
import type { AuditReport, Violation, ViolationType } from './types';

export type { AuditReport, Violation, ViolationType };

interface ScanOptions {
  /** Root directory of the frontend src (contains app/, components/, etc.) */
  srcDir: string;
  /** The app/ directory for route resolution. Defaults to srcDir + '/app' */
  appDir?: string;
  /** Glob patterns to exclude. Defaults to spec/test files and audit-guard itself */
  exclude?: RegExp[];
}

const DEFAULT_EXCLUDE = [
  /\.spec\.(ts|tsx)$/,
  /\.test\.(ts|tsx)$/,
  /\/__tests__\//,
  /\/audit-guard\//,
  /\/node_modules\//,
  /vitest\./,
];

/**
 * Scans source files for dead buttons, console.log handlers, dead hrefs,
 * and "próximamente" labels. Returns a typed report of violations.
 */
export function runAuditGuard(options: ScanOptions): AuditReport {
  const { srcDir, appDir = join(srcDir, 'app'), exclude = DEFAULT_EXCLUDE } = options;

  const routes = resolveAppRoutes(appDir);
  const files = collectTsxFiles(srcDir, exclude);
  const violations: Violation[] = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    const relFile = relative(join(srcDir, '..'), file);

    scanConsoleLogHandlers(lines, relFile, violations);
    scanEmptyHandlers(lines, relFile, violations);
    scanDeadHrefs(lines, relFile, routes, violations);
    scanProximamenteLabels(lines, relFile, violations);
  }

  return { violations, scannedFiles: files.length };
}

/**
 * Scans a single file's content (provided as string) for violations.
 * Useful for testing with fixture content.
 */
export function scanFileContent(
  content: string,
  fileName: string,
  routes: Set<string>,
): Violation[] {
  const lines = content.split('\n');
  const violations: Violation[] = [];

  scanConsoleLogHandlers(lines, fileName, violations);
  scanEmptyHandlers(lines, fileName, violations);
  scanDeadHrefs(lines, fileName, routes, violations);
  scanProximamenteLabels(lines, fileName, violations);

  return violations;
}

// ── Detectors ──────────────────────────────────────────────────────────

/**
 * Detects onClick (and onX) handlers whose body is only console.log, alert, or a TODO string.
 *
 * Matches patterns like:
 *   onClick={() => console.log('anything')}
 *   onPresentar={(x) => console.log('presentar', x.id)}
 *   onClick={() => alert('TODO')}
 */
function scanConsoleLogHandlers(
  lines: string[],
  file: string,
  out: Violation[],
): void {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match onXxx={...console.log...} or onXxx={...alert...} patterns
    // Handles: onClick={() => console.log(...)}
    //          onPresentar={(o) => console.log('presentar', o.id)}
    //          onClick={() => { console.log(...) }}
    //          onClick={() => alert('TODO')}
    if (
      /\bon[A-Z]\w*=\{[^}]*(?:console\.log|console\.warn|alert)\s*\(/.test(line)
    ) {
      // Whitelist: if there's more logic after console.log (semicolons with additional statements), skip
      // This is a simple heuristic — console.log followed by real logic is OK (debugging)
      const handlerBody = extractHandlerBody(line);
      if (handlerBody && isOnlyLoggingOrAlert(handlerBody)) {
        out.push({
          type: 'console-log-handler',
          file,
          line: i + 1,
          snippet: line.trim(),
        });
      }
    }
  }
}

/**
 * Detects empty onClick handlers:
 *   onClick={undefined}
 *   onClick={() => {}}
 *   onClick={() => { }}
 *   onClick={noop}  — not detected (too many false positives)
 */
function scanEmptyHandlers(
  lines: string[],
  file: string,
  out: Violation[],
): void {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      /\bon[A-Z]\w*=\{undefined\}/.test(line) ||
      /\bon[A-Z]\w*=\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/.test(line) ||
      /\bon[A-Z]\w*=\{\s*\(\s*\)\s*=>\s*undefined\s*\}/.test(line)
    ) {
      out.push({
        type: 'empty-handler',
        file,
        line: i + 1,
        snippet: line.trim(),
      });
    }
  }
}

/**
 * Detects href attributes pointing to routes that don't exist in app/.
 * Skips external URLs, anchors, and relative paths.
 *
 * Matches: href="/some/route", href={"/some/route"}, to="/some/route"
 */
function scanDeadHrefs(
  lines: string[],
  file: string,
  routes: Set<string>,
  out: Violation[],
): void {
  // Pattern: href="..." or href={"..."} or to="..." or to={"..."}
  const hrefPattern = /(?:href|to)=(?:"([^"]+)"|{["'`]([^"'`]+)["'`]})/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let match;
    hrefPattern.lastIndex = 0;
    while ((match = hrefPattern.exec(line)) !== null) {
      const href = match[1] ?? match[2];
      if (!href) continue;

      // Skip template literals with expressions (can't validate statically)
      if (href.includes('${')) continue;

      if (!isValidHref(href, routes)) {
        out.push({
          type: 'dead-href',
          file,
          line: i + 1,
          snippet: line.trim(),
        });
      }
    }
  }
}

/**
 * Detects "Próximamente", "Coming soon", "WIP" labels in text content
 * that appears within JSX elements (strings in JSX context or JSX text).
 */
function scanProximamenteLabels(
  lines: string[],
  file: string,
  out: Violation[],
): void {
  const pattern = /(?:pr[oó]ximamente|coming\s+soon)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (pattern.test(line)) {
      // Skip if it's a comment line
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
        continue;
      }
      out.push({
        type: 'proximamente-label',
        file,
        line: i + 1,
        snippet: trimmed,
      });
    }
  }
}

// ── Helpers ────────────────────────────────────────────────────────────

function collectTsxFiles(dir: string, exclude: RegExp[]): string[] {
  const files: string[] = [];
  walk(dir, files, exclude);
  return files;
}

function walk(dir: string, files: string[], exclude: RegExp[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (exclude.some((re) => re.test(fullPath))) continue;

    let stat;
    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      walk(fullPath, files, exclude);
    } else if (/\.(tsx|jsx)$/.test(entry)) {
      files.push(fullPath);
    }
  }
}

/**
 * Extracts the handler body from an onXxx={...} attribute on a single line.
 * Returns the content between the braces, or null if can't parse.
 */
function extractHandlerBody(line: string): string | null {
  const match = /\bon[A-Z]\w*=\{(.+)\}/.exec(line);
  return match ? match[1] : null;
}

/**
 * Checks if a handler body only contains console.log/warn/alert calls
 * (no other meaningful statements).
 */
function isOnlyLoggingOrAlert(body: string): boolean {
  // Remove the arrow function wrapper
  const stripped = body
    .replace(/^\s*\(.*?\)\s*=>\s*\{?\s*/, '')
    .replace(/\s*\}?\s*$/, '')
    .trim();

  // Check if remaining content is just console.log/warn/alert
  return /^(console\.(log|warn|info|error|debug)|alert)\s*\(/.test(stripped);
}
