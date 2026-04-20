/**
 * Pure HTML parser for ARCA vencimientos tables.
 *
 * Extracts regla data from the HTML rendered by seti.afip.gob.ar/av/.
 * Separated from browser automation (Playwright) so it can be tested
 * independently against HTML fixtures.
 *
 * The ARCA page renders one <table class="tabla-vencimientos"> per tax group.
 * Each table has 11 columns: concepto + 10 terminaciones (0-9).
 * Each row is an obligation type with dates in DD/MM/YYYY format.
 */

import { TIPO_OBLIGACION, JURISDICCION } from '@numerito/shared';
import type { TipoObligacion } from '@numerito/shared';
import type { ReglaPropuestaScrapeada } from '../../domain/ports/calendario-scraper.port';

// ── Concepto resolution ──

export interface ConceptoResuelto {
  tipo: TipoObligacion;
  regimen: string;
}

const CONCEPTO_MAP: Array<{ pattern: string; tipo: TipoObligacion; regimen: string }> = [
  { pattern: 'iva - dj mensual', tipo: TIPO_OBLIGACION.IVA, regimen: 'GENERAL' },
  { pattern: 'iva dj mensual', tipo: TIPO_OBLIGACION.IVA, regimen: 'GENERAL' },
  { pattern: 'f.2002', tipo: TIPO_OBLIGACION.IVA, regimen: 'GENERAL' },
  { pattern: 'libro de iva digital', tipo: TIPO_OBLIGACION.LIBRO_IVA_DIGITAL, regimen: 'GENERAL' },
  { pattern: 'libro iva digital', tipo: TIPO_OBLIGACION.LIBRO_IVA_DIGITAL, regimen: 'GENERAL' },
  { pattern: 'sicoss', tipo: TIPO_OBLIGACION.SICOSS, regimen: 'GENERAL' },
  { pattern: 'f.931', tipo: TIPO_OBLIGACION.SICOSS, regimen: 'GENERAL' },
  { pattern: 'monotributo', tipo: TIPO_OBLIGACION.MONOTRIBUTO, regimen: 'MONOTRIBUTO' },
  { pattern: 'sicore', tipo: TIPO_OBLIGACION.SICORE, regimen: 'GENERAL' },
  { pattern: 'f.997', tipo: TIPO_OBLIGACION.SICORE, regimen: 'GENERAL' },
  { pattern: 'f.2170', tipo: TIPO_OBLIGACION.SICORE, regimen: 'GENERAL' },
  { pattern: 'sire', tipo: TIPO_OBLIGACION.SIRE, regimen: 'GENERAL' },
  { pattern: 'ganancias sociedades', tipo: TIPO_OBLIGACION.DDJJ_GANANCIAS, regimen: 'SOCIEDADES' },
  { pattern: 'ganancias personas humanas', tipo: TIPO_OBLIGACION.DDJJ_GANANCIAS, regimen: 'PERSONAS_HUMANAS' },
  { pattern: 'f.713', tipo: TIPO_OBLIGACION.DDJJ_GANANCIAS, regimen: 'SOCIEDADES' },
  { pattern: 'bienes personales', tipo: TIPO_OBLIGACION.DDJJ_BIENES_PERSONALES, regimen: 'GENERAL' },
];

/**
 * Resolves an ARCA concepto label to a TipoObligacion + regimen.
 * Lowercases, strips parentheses, checks partial matches.
 */
export function resolverConcepto(raw: string): ConceptoResuelto | null {
  const normalized = raw
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  for (const entry of CONCEPTO_MAP) {
    if (normalized.includes(entry.pattern)) {
      return { tipo: entry.tipo, regimen: entry.regimen };
    }
  }

  return null;
}

/**
 * Parses a date string in DD/MM/YYYY format.
 */
export function parseFechaARCA(raw: string): { day: number; month: number; year: number } | null {
  const match = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  return { day, month, year };
}

export interface ArcaParseResult {
  reglas: ReglaPropuestaScrapeada[];
  errores: string[];
  conceptosIgnorados: string[];
}

/**
 * Parses the ARCA vencimientos HTML and extracts ReglaPropuestaScrapeada[].
 *
 * @param html Full HTML content of the ARCA vencimientos page
 * @param mesFiscal Fiscal period month (1-12)
 * @param anioFiscal Fiscal period year
 * @param vigenciaDesde ISO date string for vigenciaDesde on produced reglas
 */
export function parseArcaVencimientosHtml(
  html: string,
  mesFiscal: number,
  anioFiscal: number,
  vigenciaDesde: string,
): ArcaParseResult {
  const reglas: ReglaPropuestaScrapeada[] = [];
  const errores: string[] = [];
  const conceptosIgnorados: string[] = [];

  const tbodyRegex = /<tbody[^>]*>([\s\S]*?)<\/tbody>/gi;
  let tbodyMatch: RegExpExecArray | null;

  while ((tbodyMatch = tbodyRegex.exec(html)) !== null) {
    const tbodyContent = tbodyMatch[1];
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let trMatch: RegExpExecArray | null;

    while ((trMatch = trRegex.exec(tbodyContent)) !== null) {
      const trContent = trMatch[1];
      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const cells: string[] = [];
      let tdMatch: RegExpExecArray | null;

      while ((tdMatch = tdRegex.exec(trContent)) !== null) {
        const text = tdMatch[1].replace(/<[^>]*>/g, '').trim();
        cells.push(text);
      }

      if (cells.length === 0) continue;

      if (cells.length < 11) {
        // Report error for rows that have some cells but not enough
        if (cells.length > 0) {
          errores.push(
            `Fila con ${cells.length} celdas (se esperan 11): "${cells[0]}"`,
          );
        }
        continue;
      }

      const concepto = cells[0];
      const resuelto = resolverConcepto(concepto);

      if (!resuelto) {
        conceptosIgnorados.push(concepto);
        continue;
      }

      for (let i = 0; i < 10; i++) {
        const terminacion = String(i);
        const parsed = parseFechaARCA(cells[i + 1]);

        if (!parsed) {
          errores.push(
            `No se pudo parsear fecha para ${concepto}, terminación ${terminacion}: "${cells[i + 1]}"`,
          );
          continue;
        }

        // mesSiguiente = date falls in a month after the fiscal period
        const mesSiguiente =
          parsed.month > mesFiscal || (parsed.month === 1 && mesFiscal === 12);

        reglas.push({
          tipoObligacion: resuelto.tipo,
          jurisdiccion: JURISDICCION.ARCA,
          regimen: resuelto.regimen,
          terminacionCuit: terminacion,
          diaVencimiento: parsed.day,
          mesSiguiente,
          vigenciaDesde,
          vigenciaHasta: null,
        });
      }
    }
  }

  return { reglas, errores, conceptosIgnorados };
}
