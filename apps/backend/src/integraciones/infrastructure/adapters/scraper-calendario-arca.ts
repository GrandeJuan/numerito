/**
 * ScraperCalendarioARCA — Playwright-based scraper for ARCA vencimientos.
 *
 * Real flow:
 *   1. GET https://seti.afip.gob.ar/av/seleccionVencimientos.do
 *      (sets a JSESSIONID cookie; form action embeds it)
 *   2. Fill form inputs:
 *        fechaVDesde, fechaVHasta (dd/mm/yyyy, first/last day of target month)
 *        terminacionCuit = "Todos"
 *        impuestosSeleccionados = "999" (TODOS) — injected into the multi-select
 *   3. Submit the form and wait for navigation to /av/viewVencimientos.do
 *   4. Capture HTML and hand it to arca-html-parser
 *
 * Designed to run in a Fargate task with Playwright + Chromium.
 * The result is POSTed to /v1/admin/ingesta/ARCA/resultado.
 */

import type {
  CalendarioScraperPort,
  ResultadoScraping,
} from '../../domain/ports/calendario-scraper.port';
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
  fill(selector: string, value: string): Promise<void>;
  selectOption(selector: string, value: string | string[]): Promise<void>;
  evaluate<T = unknown>(fn: string | ((...args: unknown[]) => T), arg?: unknown): Promise<T>;
  waitForLoadState(state?: string): Promise<void>;
  waitForURL?(url: string | RegExp, opts?: Record<string, unknown>): Promise<void>;
}

export interface ScraperCalendarioARCAConfig {
  mesesAdelante?: number;
  vigenciaDesde?: string;
}

type BrowserFactory = () => Promise<Browser>;

function lastDayOfMonth(anio: number, mes: number): number {
  return new Date(anio, mes, 0).getDate();
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

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
    if (fuente !== 'ARCA') {
      return {
        fuente,
        ejecutadoEn: new Date().toISOString(),
        reglas: [],
        errores: [`ScraperCalendarioARCA solo soporta fuente ARCA, recibió: ${fuente}`],
      };
    }

    const now = new Date();
    const mesActual = now.getMonth() + 1;
    const anioActual = now.getFullYear();

    const allReglas = new Map<string, ResultadoScraping['reglas'][number]>();
    const allErrores: string[] = [];

    for (let offset = 0; offset <= this.config.mesesAdelante; offset++) {
      let targetMes = mesActual + offset;
      let targetAnio = anioActual;
      if (targetMes > 12) {
        targetMes -= 12;
        targetAnio += 1;
      }

      let browser: Browser | null = null;
      try {
        browser = await this.browserFactory();
        const page = await browser.newPage();
        page.setDefaultTimeout(45_000);

        await page.goto(ARCA_URL, { waitUntil: 'networkidle' });

        const desde = `01/${pad2(targetMes)}/${targetAnio}`;
        const hasta = `${pad2(lastDayOfMonth(targetAnio, targetMes))}/${pad2(targetMes)}/${targetAnio}`;

        await page.fill('input[name="fechaVDesde"]', desde);
        await page.fill('input[name="fechaVHasta"]', hasta);
        await page.selectOption('select[name="terminacionCuit"]', 'Todos');

        // The real page expects impuestosSeleccionados (the right-side multi-select)
        // to carry the chosen codes before submit. "999" = TODOS. We inject the
        // option and submit via JS — bypasses the move() helper and the Buscar
        // button (which has quirky inline onclick).
        await page.evaluate(`
          (() => {
            const form = document.forms['consultaVencimientoForm'];
            if (!form) return;
            const sel = form.elements['impuestosSeleccionados'];
            if (sel) {
              const opt = document.createElement('option');
              opt.value = '999';
              opt.text = 'TODOS';
              opt.selected = true;
              sel.appendChild(opt);
            }
            form.submit();
          })();
        `);

        if (page.waitForURL) {
          await page.waitForURL(/viewVencimientos\.do/, { timeout: 45_000 }).catch(() => {});
        }
        await page.waitForLoadState('networkidle');

        const html = await page.content();
        const parseResult = parseArcaVencimientosHtml(
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
          const unique = Array.from(new Set(parseResult.conceptosIgnorados));
          allErrores.push(
            `Conceptos sin mapeo a TipoObligacion (${unique.length}): ${unique.join(', ')}`,
          );
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        allErrores.push(`Error al scrapear ARCA (${targetAnio}-${pad2(targetMes)}): ${msg}`);
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
