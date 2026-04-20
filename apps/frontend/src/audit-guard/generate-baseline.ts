/**
 * Script to generate or update the audit-baseline.json file.
 * Run with: npx tsx src/audit-guard/generate-baseline.ts
 */
import { join } from 'path';
import { writeFileSync } from 'fs';
import { runAuditGuard } from './run-audit-guard';

const SRC_DIR = join(__dirname, '..');
const APP_DIR = join(SRC_DIR, 'app');
const BASELINE_PATH = join(__dirname, 'audit-baseline.json');

const report = runAuditGuard({ srcDir: SRC_DIR, appDir: APP_DIR });

console.log(`Scanned ${report.scannedFiles} files`);
console.log(`Found ${report.violations.length} violation(s)\n`);

for (const v of report.violations) {
  console.log(`  [${v.type}] ${v.file}:${v.line}`);
  console.log(`    ${v.snippet.slice(0, 100)}`);
}

const baseline = report.violations.map((v) => ({
  type: v.type,
  file: v.file,
  line: v.line,
  snippet: v.snippet,
}));

writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n');
console.log(`\nBaseline written to ${BASELINE_PATH}`);
