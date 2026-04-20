/**
 * Standalone Fargate entry point for ARCA calendar scraping.
 *
 * Runs outside NestJS — instantiates ScraperCalendarioARCA with real
 * Playwright, executes the scrape, and POSTs the ResultadoScraping
 * to the backend webhook endpoint.
 *
 * Environment variables:
 *   BACKEND_URL       — Base URL of the NestJS backend (e.g. https://api.numerito.app)
 *   INGESTA_SECRET    — Shared secret for authenticating webhook calls
 *   FUENTE            — Source to scrape (default: ARCA)
 *   MESES_ADELANTE    — How many future months to scrape (default: 0)
 *   DISPARADOR        — MANUAL | SCHEDULE (default: SCHEDULE)
 *   DISPARADO_POR     — Who/what triggered this execution (optional)
 *
 * Exit codes:
 *   0 — scrape completed (even if there were parse errors — those go in the payload)
 *   1 — fatal error (network, backend unreachable, etc.)
 */

import { ScraperCalendarioARCA } from '../adapters/scraper-calendario-arca';
import type { FuenteIngesta } from '../../domain/entities/configuracion-ingesta.entity';

interface EntrypointConfig {
  backendUrl: string;
  ingestaSecret: string;
  fuente: FuenteIngesta;
  mesesAdelante: number;
  disparador: 'MANUAL' | 'SCHEDULE';
  disparadoPor: string | null;
}

function loadConfig(): EntrypointConfig {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    throw new Error('BACKEND_URL environment variable is required');
  }

  const ingestaSecret = process.env.INGESTA_SECRET;
  if (!ingestaSecret) {
    throw new Error('INGESTA_SECRET environment variable is required');
  }

  return {
    backendUrl: backendUrl.replace(/\/$/, ''),
    ingestaSecret,
    fuente: (process.env.FUENTE as FuenteIngesta) || 'ARCA',
    mesesAdelante: parseInt(process.env.MESES_ADELANTE || '0', 10),
    disparador: (process.env.DISPARADOR as 'MANUAL' | 'SCHEDULE') || 'SCHEDULE',
    disparadoPor: process.env.DISPARADO_POR || null,
  };
}

async function postResultado(
  config: EntrypointConfig,
  payload: unknown,
): Promise<{ ok: boolean; status: number; body: string }> {
  const url = `${config.backendUrl}/api/v1/admin/ingesta/${config.fuente}/resultado`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-ingesta-secret': config.ingestaSecret,
    },
    body: JSON.stringify(payload),
  });

  const body = await response.text();
  return { ok: response.ok, status: response.status, body };
}

async function main(): Promise<void> {
  const startTime = Date.now();
  console.log('[scraper-entrypoint] Starting...');

  const config = loadConfig();
  console.log(`[scraper-entrypoint] fuente=${config.fuente} mesesAdelante=${config.mesesAdelante} disparador=${config.disparador}`);

  const scraper = new ScraperCalendarioARCA(
    ScraperCalendarioARCA.defaultBrowserFactory(),
    { mesesAdelante: config.mesesAdelante },
  );

  console.log('[scraper-entrypoint] Launching Playwright browser...');
  const resultado = await scraper.scrapear(config.fuente);

  console.log(
    `[scraper-entrypoint] Scrape complete: ${resultado.reglas.length} reglas, ${resultado.errores.length} errores`,
  );

  if (resultado.errores.length > 0) {
    console.warn('[scraper-entrypoint] Errores during scraping:');
    for (const err of resultado.errores) {
      console.warn(`  - ${err}`);
    }
  }

  console.log(`[scraper-entrypoint] POSTing resultado to ${config.backendUrl}...`);
  const { ok, status, body } = await postResultado(config, resultado);

  if (!ok) {
    console.error(`[scraper-entrypoint] Backend rejected resultado: HTTP ${status}`);
    console.error(`[scraper-entrypoint] Response body: ${body}`);
    process.exit(1);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[scraper-entrypoint] Done in ${elapsed}s. Backend responded: HTTP ${status}`);
}

main().catch((err) => {
  console.error('[scraper-entrypoint] Fatal error:', err);
  process.exit(1);
});
