/**
 * Smoke test: run all 4 scrapers against live official sites.
 *
 * Usage:  pnpm smoke:scrapers
 *
 * Runs each scraper with MESES_ADELANTE=0, prints a summary table
 * (fuente | reglas | feriados | errores | tiempo), and exits.
 *
 * - Does NOT persist anything — no backend or database needed.
 * - Does NOT run in CI (not in turbo.json or workflows).
 * - Exit code 0 if all 4 scrapers returned (even with parse errors).
 * - Exit code 1 only if Playwright could not launch at all.
 */

import { createScraper, type EntrypointConfig } from '../apps/backend/src/integraciones/infrastructure/fargate/scraper-entrypoint';
import type { FuenteIngesta } from '../apps/backend/src/integraciones/domain/entities/configuracion-ingesta.entity';

const FUENTES: FuenteIngesta[] = ['ARCA', 'ARBA', 'AGIP', 'BCRA_FERIADOS'];

interface SmokeResult {
  fuente: FuenteIngesta;
  reglas: number;
  feriados: number;
  errores: number;
  tiempoMs: number;
  error?: string; // fatal error (Playwright crash, etc.)
}

function dummyConfig(fuente: FuenteIngesta): EntrypointConfig {
  return {
    backendUrl: 'http://localhost:3001', // unused — we never POST
    ingestaSecret: 'unused',
    fuente,
    mesesAdelante: 0,
    disparador: 'MANUAL',
    disparadoPor: 'smoke-scrapers',
    ejecucionId: null,
  };
}

async function runScraper(fuente: FuenteIngesta): Promise<SmokeResult> {
  const t0 = Date.now();
  try {
    const scraper = createScraper(dummyConfig(fuente));
    const resultado: ResultadoScraping = await scraper.scrapear(fuente);
    return {
      fuente,
      reglas: resultado.reglas.length,
      feriados: resultado.feriados?.length ?? 0,
      errores: resultado.errores.length,
      tiempoMs: Date.now() - t0,
    };
  } catch (err) {
    return {
      fuente,
      reglas: 0,
      feriados: 0,
      errores: 1,
      tiempoMs: Date.now() - t0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function formatMs(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function printTable(results: SmokeResult[]): void {
  const divider = '-'.repeat(90);
  console.log('\n' + divider);
  console.log(
    `  ${'fuente'.padEnd(14)} ${'reglas'.padStart(6)} ${'feriados'.padStart(8)} ${'errores'.padStart(7)} ${'tiempo'.padStart(8)}  estado`,
  );
  console.log(divider);
  for (const r of results) {
    const estado = r.error
      ? `FATAL: ${r.error.slice(0, 50)}`
      : r.reglas === 0
        ? 'WARNING: 0 reglas'
        : 'OK';
    console.log(
      `  ${r.fuente.padEnd(14)} ${String(r.reglas).padStart(6)} ${String(r.feriados).padStart(8)} ${String(r.errores).padStart(7)} ${formatMs(r.tiempoMs).padStart(8)}  ${estado}`,
    );
  }
  console.log(divider);
}

async function main(): Promise<void> {
  console.log('[smoke-scrapers] Running 4 scrapers against live official sites...');
  console.log('[smoke-scrapers] MESES_ADELANTE=0 — current month only, no persistence.\n');

  const results: SmokeResult[] = [];

  // Run scrapers sequentially to avoid overwhelming sites / Playwright resource contention
  for (const fuente of FUENTES) {
    console.log(`[smoke-scrapers] Starting ${fuente}...`);
    const result = await runScraper(fuente);
    results.push(result);

    if (result.error) {
      console.error(`[smoke-scrapers] ${fuente} FATAL: ${result.error}`);
    } else {
      console.log(
        `[smoke-scrapers] ${fuente} done: ${result.reglas} reglas, ${result.feriados} feriados, ${result.errores} errores (${formatMs(result.tiempoMs)})`,
      );
    }
  }

  printTable(results);

  // Highlight zero-regla results (possible upstream HTML change)
  const zeroReglas = results.filter((r) => r.reglas === 0 && !r.error);
  if (zeroReglas.length > 0) {
    console.log('\n[smoke-scrapers] WARNING: The following fuentes returned 0 reglas.');
    console.log('[smoke-scrapers] This may indicate an upstream HTML structure change:');
    for (const r of zeroReglas) {
      console.log(`  - ${r.fuente}`);
    }
  }

  const fatalCount = results.filter((r) => r.error).length;
  if (fatalCount > 0) {
    console.log(`\n[smoke-scrapers] ${fatalCount} scraper(s) had fatal errors (see above).`);
  }

  const totalTime = results.reduce((sum, r) => sum + r.tiempoMs, 0);
  console.log(`\n[smoke-scrapers] Total time: ${formatMs(totalTime)}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    // Only reaches here if Playwright itself can't initialize at all
    console.error('[smoke-scrapers] Playwright could not start:', err);
    process.exit(1);
  });
