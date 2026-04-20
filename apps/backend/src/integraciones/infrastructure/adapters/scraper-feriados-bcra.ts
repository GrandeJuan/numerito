/**
 * ScraperFeriadosBCRA — Playwright-based scraper for BCRA bank holidays.
 *
 * Navigates to bcra.gob.ar and extracts the annual bank holiday calendar.
 * Unlike ARCA/ARBA/AGIP scrapers which produce reglas, this one produces
 * feriados (holidays) — a fundamentally different output type.
 *
 * Designed to run in a Fargate task with Playwright + Chromium.
 * The result is POSTed to /v1/admin/ingesta/BCRA_FERIADOS/resultado.
 *
 * Architecture:
 * - Browser automation: this file (Playwright)
 * - HTML parsing: bcra-feriados-parser.ts (pure, independently testable)
 */

import type { CalendarioScraperPort, ResultadoScraping } from '../../domain/ports/calendario-scraper.port';
import type { FuenteIngesta } from '../../domain/entities/configuracion-ingesta.entity';
import { parseBcraFeriadosHtml } from './bcra-feriados-parser';

const BCRA_URL = 'https://www.bcra.gob.ar/SistemasFinancierosYdePagos/Feriados_i.asp';

interface Browser {
  newPage(): Promise<Page>;
  close(): Promise<void>;
}

interface Page {
  setDefaultTimeout(ms: number): void;
  goto(url: string, opts?: Record<string, unknown>): Promise<unknown>;
  content(): Promise<string>;
  locator(selector: string): { count(): Promise<number>; selectOption(value: string): Promise<void> };
  waitForLoadState(state?: string): Promise<void>;
}

export interface ScraperFeriadosBCRAConfig {
  anio?: number;
}

type BrowserFactory = () => Promise<Browser>;

export class ScraperFeriadosBCRA implements CalendarioScraperPort {
  private readonly browserFactory: BrowserFactory;
  private readonly config: Required<ScraperFeriadosBCRAConfig>;

  constructor(browserFactory: BrowserFactory, config: ScraperFeriadosBCRAConfig = {}) {
    this.browserFactory = browserFactory;
    this.config = {
      anio: config.anio ?? new Date().getFullYear(),
    };
  }

  static defaultBrowserFactory(): BrowserFactory {
    return async () => {
      const { chromium } = await import('playwright');
      return chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage'],
      });
    };
  }

  async scrapear(fuente: FuenteIngesta): Promise<ResultadoScraping> {
    if (fuente !== 'BCRA_FERIADOS') {
      return {
        fuente,
        ejecutadoEn: new Date().toISOString(),
        reglas: [],
        errores: [`ScraperFeriadosBCRA solo soporta fuente BCRA_FERIADOS, recibió: ${fuente}`],
      };
    }

    const now = new Date();
    let browser: Browser | null = null;

    try {
      browser = await this.browserFactory();
      const page = await browser.newPage();

      page.setDefaultTimeout(30_000);
      await page.goto(BCRA_URL, { waitUntil: 'networkidle' });

      // Select year if dropdown exists
      const anioLocator = page.locator('select[name="anio"], #anio, select.anio');
      if (await anioLocator.count() > 0) {
        await anioLocator.selectOption(String(this.config.anio)).catch(() => {});
        await page.waitForLoadState('networkidle');
      }

      const html = await page.content();

      const parseResult = parseBcraFeriadosHtml(html);

      return {
        fuente: 'BCRA_FERIADOS',
        ejecutadoEn: now.toISOString(),
        reglas: [], // BCRA produces feriados, not reglas
        feriados: parseResult.feriados,
        errores: parseResult.errores,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return {
        fuente: 'BCRA_FERIADOS',
        ejecutadoEn: now.toISOString(),
        reglas: [],
        feriados: [],
        errores: [`Error al scrapear BCRA feriados (${this.config.anio}): ${msg}`],
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
