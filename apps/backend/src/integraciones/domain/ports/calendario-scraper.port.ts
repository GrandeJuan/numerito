/**
 * Port for calendar/vencimiento scrapers.
 * Distinct from FiscalScraperPort — this one scrapes public calendars
 * (ARCA seti.afip.gob.ar/av/, ARBA, AGIP, BCRA feriados) without
 * client credentials. Runs as a Fargate task via EventBridge Scheduler.
 *
 * Infrastructure:
 * - ECS Fargate task with Playwright headless browser
 * - EventBridge Scheduler per fuente (default: 7d ARCA/ARBA/AGIP, 30d BCRA)
 * - Results pushed to POST /v1/admin/ingesta/:fuente/resultado (internal endpoint)
 */

import type { TipoObligacion, Jurisdiccion } from '@numerito/shared';
import type { FuenteIngesta } from '../entities/configuracion-ingesta.entity';

export interface ReglaPropuestaScrapeada {
  tipoObligacion: TipoObligacion;
  jurisdiccion: Jurisdiccion;
  regimen: string;
  terminacionCuit: string;
  diaVencimiento: number;
  mesSiguiente: boolean;
  vigenciaDesde: string; // ISO date string
  vigenciaHasta?: string | null;
}

export interface ResultadoScraping {
  fuente: FuenteIngesta;
  ejecutadoEn: string; // ISO datetime
  reglas: ReglaPropuestaScrapeada[];
  errores: string[];
}

export interface CalendarioScraperPort {
  scrapear(fuente: FuenteIngesta): Promise<ResultadoScraping>;
}

export const CALENDARIO_SCRAPER = Symbol('CalendarioScraper');
