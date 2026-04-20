/**
 * ScraperCalendarioARCA — Playwright-based scraper for ARCA vencimientos.
 *
 * Navigates to seti.afip.gob.ar/av/seleccionVencimientos.do, selects the
 * target period, and parses the resulting vencimientos table.
 *
 * Designed to run in a Fargate task with Playwright + Chromium.
 * The result is POSTed to /v1/admin/ingesta/ARCA/resultado.
 *
 * Architecture:
 * - Browser automation: this file (Playwright)
 * - HTML parsing: arca-html-parser.ts (pure, independently testable)
 */

import type { CalendarioScraperPort, ResultadoScraping } from '../../domain/ports/calendario-scraper.port';
import type { FuenteIngesta } from '../../domain/entities/configuracion-ingesta.entity';
import { parseArcaVencimientosHtml } from './arca-html-parser';

const ARCA_URL = 'https://seti.afip.gob.ar/av/seleccionVencimientos.do';

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
  selectOption?(selector: string, value: string): Promise<void>;
}

export interface ScraperCalendarioARCAConfig {
  mesesAdelante?: number;
  vigenciaDesde?: string;
}

type BrowserFactory = () => Promise<Browser>;

export class ScraperCalendarioARCA implements CalendarioScraperPort {
  private readonly browserFactory: BrowserFactory;
  private readonly config: Required<ScraperCalendarioARCAConfig>;

  constructor(browserFactory: BrowserFactory, config: ScraperCalendarioARCAConfig = {}) {
    this.browserFactory = browserFactory;
    this.config = {
      mesesAdelante: config.mesesAdelante ?? 0,
      vigenciaDesde: config.vigenciaDesde ?? new Date().toISOString().slice(0, 10),
    };
  }

  /**
   * Default factory that launches Playwright Chromium.
   * Used in production (Fargate); tests inject a mock factory.
   */
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
    if (fuente !== 'ARCA') {
      return {
        fuente,
        ejecutadoEn: new Date().toISOString(),
        reglas: [],
        errores: [`ScraperCalendarioARCA solo soporta fuente ARCA, recibió: ${fuente}`],
      };
    }

    const now = new Date();
    let mes = now.getMonth() + 1;
    let anio = now.getFullYear();

    // Collect reglas across multiple months if configured
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
        await page.goto(ARCA_URL, { waitUntil: 'networkidle' });

        // Select period if selector exists
        const periodoLocator = page.locator('select[name="periodo"], #periodo');
        if (await periodoLocator.count() > 0) {
          const mesStr = String(targetMes).padStart(2, '0');
          await periodoLocator.selectOption(`${targetAnio}${mesStr}`).catch(() => {});
        }

        await page.waitForLoadState('networkidle');

        const html = await page.content();

        const parseResult = parseArcaVencimientosHtml(
          html,
          targetMes,
          targetAnio,
          this.config.vigenciaDesde,
        );

        // Deduplicate by natural key — last month wins
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
        allErrores.push(`Error al scrapear ARCA (${targetAnio}-${String(targetMes).padStart(2, '0')}): ${msg}`);
      } finally {
        if (browser) {
          await browser.close();
        }
      }
    }

    return {
      fuente: 'ARCA',
      ejecutadoEn: now.toISOString(),
      reglas: Array.from(allReglas.values()),
      errores: allErrores,
    };
  }
}
