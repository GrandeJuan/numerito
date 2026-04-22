/**
 * Standalone Fargate entry point for calendar scraping.
 *
 * Runs outside NestJS — instantiates the appropriate scraper based on
 * the FUENTE env var, executes the scrape, and POSTs the ResultadoScraping
 * to the backend webhook endpoint.
 *
 * Supported scrapers:
 *   ARCA           — ScraperCalendarioARCA (seti.afip.gob.ar)
 *   ARBA           — ScraperCalendarioARBA (web.arba.gov.ar)
 *   AGIP           — ScraperCalendarioAGIP (agip.gob.ar)
 *   BCRA_FERIADOS  — ScraperFeriadosBCRA  (bcra.gob.ar)
 *
 * Environment variables:
 *   BACKEND_URL       — Base URL of the NestJS backend (e.g. https://api.numerito.app)
 *   INGESTA_SECRET    — Shared secret for authenticating webhook calls
 *   FUENTE            — Source to scrape (required: ARCA | ARBA | AGIP | BCRA_FERIADOS)
 *   MESES_ADELANTE    — How many future months to scrape (default: 0, ignored by BCRA_FERIADOS)
 *   DISPARADOR        — MANUAL | SCHEDULE (default: SCHEDULE)
 *   DISPARADO_POR     — Who/what triggered this execution (optional)
 *
 * Exit codes:
 *   0 — scrape completed (even if there were parse errors — those go in the payload)
 *   1 — fatal error (network, backend unreachable, unsupported fuente, etc.)
 */

import { ScraperCalendarioARCA } from '../adapters/scraper-calendario-arca';
import { ScraperCalendarioARBA } from '../adapters/scraper-calendario-arba';
import { ScraperCalendarioAGIP } from '../adapters/scraper-calendario-agip';
import { ScraperFeriadosBCRA } from '../adapters/scraper-feriados-bcra';
import type { CalendarioScraperPort } from '../../domain/ports/calendario-scraper.port';
import type { FuenteIngesta } from '../../domain/entities/configuracion-ingesta.entity';

const VALID_FUENTES: readonly FuenteIngesta[] = ['ARCA', 'ARBA', 'AGIP', 'BCRA_FERIADOS'];

export interface EntrypointConfig {
  backendUrl: string;
  ingestaSecret: string;
  fuente: FuenteIngesta;
  mesesAdelante: number;
  disparador: 'MANUAL' | 'SCHEDULE';
  disparadoPor: string | null;
  /** Correlation id of a pre-created EjecucionIngesta record. Null for SCHEDULE runs. */
  ejecucionId: string | null;
}

export function loadConfig(): EntrypointConfig {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    throw new Error('BACKEND_URL environment variable is required');
  }

  const ingestaSecret = process.env.INGESTA_SECRET;
  if (!ingestaSecret) {
    throw new Error('INGESTA_SECRET environment variable is required');
  }

  const fuente = (process.env.FUENTE as FuenteIngesta) || 'ARCA';
  if (!VALID_FUENTES.includes(fuente)) {
    throw new Error(`Unsupported FUENTE: ${fuente}. Valid values: ${VALID_FUENTES.join(', ')}`);
  }

  return {
    backendUrl: backendUrl.replace(/\/$/, ''),
    ingestaSecret,
    fuente,
    mesesAdelante: parseInt(process.env.MESES_ADELANTE || '0', 10),
    disparador: (process.env.DISPARADOR as 'MANUAL' | 'SCHEDULE') || 'SCHEDULE',
    disparadoPor: process.env.DISPARADO_POR || null,
    ejecucionId: process.env.EJECUCION_ID || null,
  };
}

/**
 * Factory that instantiates the correct scraper for the given fuente.
 * Each scraper uses Playwright via its own defaultBrowserFactory().
 */
export function createScraper(config: EntrypointConfig): CalendarioScraperPort {
  switch (config.fuente) {
    case 'ARCA':
      return new ScraperCalendarioARCA(ScraperCalendarioARCA.defaultBrowserFactory(), {
        mesesAdelante: config.mesesAdelante,
      });
    case 'ARBA':
      return new ScraperCalendarioARBA(ScraperCalendarioARBA.defaultBrowserFactory(), {
        mesesAdelante: config.mesesAdelante,
      });
    case 'AGIP':
      return new ScraperCalendarioAGIP(ScraperCalendarioAGIP.defaultBrowserFactory(), {
        mesesAdelante: config.mesesAdelante,
      });
    case 'BCRA_FERIADOS':
      return new ScraperFeriadosBCRA(ScraperFeriadosBCRA.defaultBrowserFactory());
    default: {
      const _exhaustive: never = config.fuente;
      throw new Error(`Unsupported fuente: ${_exhaustive}`);
    }
  }
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
  console.log(
    `[scraper-entrypoint] fuente=${config.fuente} mesesAdelante=${config.mesesAdelante} disparador=${config.disparador}`,
  );

  const scraper = createScraper(config);

  console.log('[scraper-entrypoint] Launching Playwright browser...');
  const resultado = await scraper.scrapear(config.fuente);

  const reglasCount = resultado.reglas.length;
  const feriadosCount = resultado.feriados?.length ?? 0;
  console.log(
    `[scraper-entrypoint] Scrape complete: ${reglasCount} reglas, ${feriadosCount} feriados, ${resultado.errores.length} errores`,
  );

  if (resultado.errores.length > 0) {
    console.warn('[scraper-entrypoint] Errores during scraping:');
    for (const err of resultado.errores) {
      console.warn(`  - ${err}`);
    }
  }

  console.log(`[scraper-entrypoint] POSTing resultado to ${config.backendUrl}...`);
  const payload = config.ejecucionId
    ? { ...resultado, ejecucionId: config.ejecucionId }
    : resultado;
  const { ok, status, body } = await postResultado(config, payload);

  if (!ok) {
    console.error(`[scraper-entrypoint] Backend rejected resultado: HTTP ${status}`);
    console.error(`[scraper-entrypoint] Response body: ${body}`);
    process.exit(1);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[scraper-entrypoint] Done in ${elapsed}s. Backend responded: HTTP ${status}`);
}

// Only run main() when this file is the entry point (not when imported for testing)
const isMainModule = typeof require !== 'undefined' && require.main === module;

if (isMainModule) {
  main().catch((err) => {
    console.error('[scraper-entrypoint] Fatal error:', err);
    process.exit(1);
  });
}
