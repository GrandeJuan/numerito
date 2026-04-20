/**
 * Pure HTML parser for ARBA vencimientos tables.
 *
 * Extracts regla data from the HTML rendered by web.arba.gov.ar calendario
 * de vencimientos. Separated from browser automation (Playwright) so it can
 * be tested independently against HTML fixtures.
 *
 * The ARBA page renders one <table class="tabla-calendario"> per tax group.
 * Each table has 11 columns: concepto + 10 terminaciones (0-9).
 * Dates are in DD/MM/YYYY format.
 *
 * ARBA obligations: IIBB Contribuyente Directo, IIBB Convenio Multilateral,
 * Retenciones IIBB, Percepciones IIBB. Non-IIBB obligations (Inmobiliario,
 * Automotor, Embarcaciones) are ignored — they're property taxes, not
 * income-related obligations that a contable manages monthly.
 */

import { TIPO_OBLIGACION, JURISDICCION } from '@numerito/shared';
import type { TipoObligacion } from '@numerito/shared';
import type { ReglaPropuestaScrapeada } from '../../domain/ports/calendario-scraper.port';

// ── Concepto resolution ──

export interface ConceptoResueltoArba {
  tipo: TipoObligacion;
  regimen: string;
}

const CONCEPTO_MAP_ARBA: Array<{
  pattern: string;
  tipo: TipoObligacion;
  regimen: string;
}> = [
  // IIBB Contribuyente Directo
  { pattern: 'ddjj mensual iibb - contribuyente directo', tipo: TIPO_OBLIGACION.IIBB_ARBA, regimen: 'CONTRIBUYENTE_DIRECTO' },
  { pattern: 'ddjj iibb contribuyente directo', tipo: TIPO_OBLIGACION.IIBB_ARBA, regimen: 'CONTRIBUYENTE_DIRECTO' },
  { pattern: 'anticipo mensual iibb - contribuyente directo', tipo: TIPO_OBLIGACION.IIBB_ARBA, regimen: 'CONTRIBUYENTE_DIRECTO_ANTICIPO' },
  { pattern: 'anticipo iibb contribuyente directo', tipo: TIPO_OBLIGACION.IIBB_ARBA, regimen: 'CONTRIBUYENTE_DIRECTO_ANTICIPO' },

  // IIBB Convenio Multilateral
  { pattern: 'ddjj mensual iibb - convenio multilateral', tipo: TIPO_OBLIGACION.IIBB_CONVENIO_MULTILATERAL, regimen: 'CONVENIO_MULTILATERAL' },
  { pattern: 'ddjj iibb convenio multilateral', tipo: TIPO_OBLIGACION.IIBB_CONVENIO_MULTILATERAL, regimen: 'CONVENIO_MULTILATERAL' },
  { pattern: 'iibb - convenio multilateral', tipo: TIPO_OBLIGACION.IIBB_CONVENIO_MULTILATERAL, regimen: 'CONVENIO_MULTILATERAL' },
  { pattern: 'convenio multilateral', tipo: TIPO_OBLIGACION.IIBB_CONVENIO_MULTILATERAL, regimen: 'CONVENIO_MULTILATERAL' },

  // Retenciones IIBB
  { pattern: 'retenciones iibb', tipo: TIPO_OBLIGACION.RETENCION_IIBB, regimen: 'GENERAL' },
  { pattern: 'retencion iibb', tipo: TIPO_OBLIGACION.RETENCION_IIBB, regimen: 'GENERAL' },
  { pattern: 'ret. iibb', tipo: TIPO_OBLIGACION.RETENCION_IIBB, regimen: 'GENERAL' },

  // Percepciones IIBB
  { pattern: 'percepciones iibb', tipo: TIPO_OBLIGACION.PERCEPCION_IIBB, regimen: 'GENERAL' },
  { pattern: 'percepcion iibb', tipo: TIPO_OBLIGACION.PERCEPCION_IIBB, regimen: 'GENERAL' },
  { pattern: 'perc. iibb', tipo: TIPO_OBLIGACION.PERCEPCION_IIBB, regimen: 'GENERAL' },
];

/**
 * Resolves an ARBA concepto label to a TipoObligacion + regimen.
 * Lowercases, strips parentheses and extra whitespace, checks partial matches.
 * Returns null for unknown/irrelevant concepts (Inmobiliario, Automotor, etc.).
 */
export function resolverConceptoArba(raw: string): ConceptoResueltoArba | null {
  const normalized = raw
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[áà]/g, 'a')
    .replace(/[éè]/g, 'e')
    .replace(/[íì]/g, 'i')
    .replace(/[óò]/g, 'o')
    .replace(/[úù]/g, 'u')
    .replace(/\s+/g, ' ')
    .trim();

  for (const entry of CONCEPTO_MAP_ARBA) {
    if (normalized.includes(entry.pattern)) {
      return { tipo: entry.tipo, regimen: entry.regimen };
    }
  }

  return null;
}

/**
 * Parses a date string in DD/MM/YYYY format (same format as ARCA).
 */
export function parseFechaArba(raw: string): { day: number; month: number; year: number } | null {
  const match = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  return { day, month, year };
}

export interface ArbaParseResult {
  reglas: ReglaPropuestaScrapeada[];
  errores: string[];
  conceptosIgnorados: string[];
}

/**
 * Parses the ARBA vencimientos HTML and extracts ReglaPropuestaScrapeada[].
 *
 * @param html Full HTML content of the ARBA vencimientos page
 * @param mesFiscal Fiscal period month (1-12)
 * @param anioFiscal Fiscal period year
 * @param vigenciaDesde ISO date string for vigenciaDesde on produced reglas
 */
export function parseArbaVencimientosHtml(
  html: string,
  mesFiscal: number,
  anioFiscal: number,
  vigenciaDesde: string,
): ArbaParseResult {
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
        if (cells.length > 0) {
          errores.push(
            `Fila con ${cells.length} celdas (se esperan 11): "${cells[0]}"`,
          );
        }
        continue;
      }

      const concepto = cells[0];
      const resuelto = resolverConceptoArba(concepto);

      if (!resuelto) {
        conceptosIgnorados.push(concepto);
        continue;
      }

      for (let i = 0; i < 10; i++) {
        const terminacion = String(i);
        const parsed = parseFechaArba(cells[i + 1]);

        if (!parsed) {
          errores.push(
            `No se pudo parsear fecha para ${concepto}, terminación ${terminacion}: "${cells[i + 1]}"`,
          );
          continue;
        }

        const mesSiguiente =
          parsed.month > mesFiscal || (parsed.month === 1 && mesFiscal === 12);

        reglas.push({
          tipoObligacion: resuelto.tipo,
          jurisdiccion: JURISDICCION.ARBA,
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
