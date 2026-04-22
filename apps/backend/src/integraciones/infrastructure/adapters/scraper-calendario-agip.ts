/**
 * ScraperCalendarioAGIP — Playwright-based scraper for AGIP vencimientos.
 *
 * Navigates to agip.gob.ar calendario de vencimientos CABA, selects the
 * target period, and parses the resulting vencimientos tables.
 *
 * Designed to run in a Fargate task with Playwright + Chromium.
 * The result is POSTed to /v1/admin/ingesta/AGIP/resultado.
 *
 * Architecture:
 * - Browser automation: this file (Playwright)
 * - HTML parsing: agip-html-parser.ts (pure, independently testable)
 */

import type {
  CalendarioScraperPort,
  ResultadoScraping,
} from '../../domain/ports/calendario-scraper.port';
import type { FuenteIngesta } from '../../domain/entities/configuracion-ingesta.entity';
import { parseAgipVencimientosHtml } from './agip-html-parser';

const AGIP_URL = 'https://www.agip.gob.ar/calendario-de-vencimientos';

interface Browser {
  newPage(): Promise<Page>;
  close(): Promise<void>;
}

interface Page {
  setDefaultTimeout(ms: number): void;
  goto(url: string, opts?: Record<string, unknown>): Promise<unknown>;
  content(): Promise<string>;
  locator(selector: string): {
    count(): Promise<number>;
    selectOption(value: string): Promise<void>;
  };
  waitForLoadState(state?: string): Promise<void>;
}

export interface ScraperCalendarioAGIPConfig {
  mesesAdelante?: number;
  vigenciaDesde?: string;
}

type BrowserFactory = () => Promise<Browser>;

export class ScraperCalendarioAGIP implements CalendarioScraperPort {
  private readonly browserFactory: BrowserFactory;
  private readonly config: Required<ScraperCalendarioAGIPConfig>;

  constructor(browserFactory: BrowserFactory, config: ScraperCalendarioAGIPConfig = {}) {
    this.browserFactory = browserFactory;
    this.config = {
      mesesAdelante: config.mesesAdelante ?? 0,
      vigenciaDesde: config.vigenciaDesde ?? new Date().toISOString().slice(0, 10),
    };
  }

  static defaultBrowserFactory(): BrowserFactory {
    return async () => {
      const { chromium } = await import('playwright');
      const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage'],
      });
      return browser as unknown as Browser;
    };
  }

  async scrapear(fuente: FuenteIngesta): Promise<ResultadoScraping> {
    if (fuente !== 'AGIP') {
      return {
        fuente,
        ejecutadoEn: new Date().toISOString(),
        reglas: [],
        errores: [`ScraperCalendarioAGIP solo soporta fuente AGIP, recibió: ${fuente}`],
      };
    }

    const now = new Date();
    const mes = now.getMonth() + 1;
    const anio = now.getFullYear();

    const allReglas: Map<string, ResultadoScraping['reglas'][number]> = new Map();
    const allErrores: string[] = [];

    for (let offset = 0; offset <= this.config.mesesAdelante; offset++) {
      let targetMes = mes + offset;
      let targetAnio = anio;
      if (targetMes > 12) {
        targetMes -= 12;
        targetAnio += 1;
      }

      let browser: Browser | null = null;
      try {
        browser = await this.browserFactory();
        const page = await browser.newPage();

        page.setDefaultTimeout(30_000);
        await page.goto(AGIP_URL, { waitUntil: 'networkidle' });

        // Select period if dropdown exists
        const periodoLocator = page.locator('select[name="periodo"], #periodo, select.periodo');
        if ((await periodoLocator.count()) > 0) {
          const mesStr = String(targetMes).padStart(2, '0');
          await periodoLocator.selectOption(`${targetAnio}${mesStr}`).catch(() => {});
        }

        await page.waitForLoadState('networkidle');

        const html = await page.content();

        const parseResult = parseAgipVencimientosHtml(
          html,
          targetMes,
          targetAnio,
          this.config.vigenciaDesde,
        );

        for (const regla of parseResult.reglas) {
          const key = `${regla.tipoObligacion}|${regla.jurisdiccion}|${regla.regimen}|${regla.terminacionCuit}`;
          allReglas.set(key, regla);
        }

        allErrores.push(...parseResult.errores);

        if (parseResult.conceptosIgnorados.length > 0) {
          allErrores.push(
            `Conceptos no reconocidos (${parseResult.conceptosIgnorados.length}): ${parseResult.conceptosIgnorados.join(', ')}`,
          );
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        allErrores.push(
          `Error al scrapear AGIP (${targetAnio}-${String(targetMes).padStart(2, '0')}): ${msg}`,
        );
      } finally {
        if (browser) {
          await browser.close();
        }
      }
    }

    return {
      fuente: 'AGIP',
      ejecutadoEn: now.toISOString(),
      reglas: Array.from(allReglas.values()),
      errores: allErrores,
    };
  }
}
