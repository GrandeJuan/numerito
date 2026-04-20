/**
 * Pure HTML parser for AGIP vencimientos tables.
 *
 * Extracts regla data from the HTML rendered by agip.gob.ar calendario
 * de vencimientos. Separated from browser automation (Playwright) so it
 * can be tested independently against HTML fixtures.
 *
 * AGIP (Administración Gubernamental de Ingresos Públicos) is CABA's
 * tax authority. Publishes IIBB CABA vencimiento dates.
 *
 * Structure: one <table class="grilla-vtos"> per tax group.
 * 11 columns: obligación + 10 terminaciones (0-9).
 * Dates in DD/MM/YYYY format.
 *
 * AGIP obligations: IIBB Categoría Locales, IIBB Convenio Multilateral,
 * Retenciones IIBB CABA, Percepciones IIBB CABA.
 * Non-IIBB obligations (ABL, Patentes) are ignored.
 */

import { TIPO_OBLIGACION, JURISDICCION } from '@numerito/shared';
import type { TipoObligacion } from '@numerito/shared';
import type { ReglaPropuestaScrapeada } from '../../domain/ports/calendario-scraper.port';

// ── Concepto resolution ──

export interface ConceptoResueltoAgip {
  tipo: TipoObligacion;
  regimen: string;
}

const CONCEPTO_MAP_AGIP: Array<{
  pattern: string;
  tipo: TipoObligacion;
  regimen: string;
}> = [
  // IIBB Categoría Locales
  { pattern: 'ddjj mensual iibb - categoria locales', tipo: TIPO_OBLIGACION.IIBB_AGIP, regimen: 'CATEGORIA_LOCALES' },
  { pattern: 'ddjj iibb categoria locales', tipo: TIPO_OBLIGACION.IIBB_AGIP, regimen: 'CATEGORIA_LOCALES' },
  { pattern: 'ddjj iibb locales', tipo: TIPO_OBLIGACION.IIBB_AGIP, regimen: 'CATEGORIA_LOCALES' },
  { pattern: 'anticipo mensual iibb - categoria locales', tipo: TIPO_OBLIGACION.IIBB_AGIP, regimen: 'CATEGORIA_LOCALES_ANTICIPO' },
  { pattern: 'anticipo iibb categoria locales', tipo: TIPO_OBLIGACION.IIBB_AGIP, regimen: 'CATEGORIA_LOCALES_ANTICIPO' },
  { pattern: 'anticipo iibb locales', tipo: TIPO_OBLIGACION.IIBB_AGIP, regimen: 'CATEGORIA_LOCALES_ANTICIPO' },

  // IIBB Convenio Multilateral (CM05 = CABA)
  { pattern: 'ddjj mensual iibb - convenio multilateral', tipo: TIPO_OBLIGACION.IIBB_CONVENIO_MULTILATERAL, regimen: 'CONVENIO_MULTILATERAL_CABA' },
  { pattern: 'ddjj iibb convenio multilateral', tipo: TIPO_OBLIGACION.IIBB_CONVENIO_MULTILATERAL, regimen: 'CONVENIO_MULTILATERAL_CABA' },
  { pattern: 'iibb - convenio multilateral', tipo: TIPO_OBLIGACION.IIBB_CONVENIO_MULTILATERAL, regimen: 'CONVENIO_MULTILATERAL_CABA' },

  // Retenciones IIBB CABA
  { pattern: 'retenciones iibb caba', tipo: TIPO_OBLIGACION.RETENCION_IIBB, regimen: 'CABA' },
  { pattern: 'retencion iibb caba', tipo: TIPO_OBLIGACION.RETENCION_IIBB, regimen: 'CABA' },
  { pattern: 'retenciones iibb', tipo: TIPO_OBLIGACION.RETENCION_IIBB, regimen: 'CABA' },

  // Percepciones IIBB CABA
  { pattern: 'percepciones iibb caba', tipo: TIPO_OBLIGACION.PERCEPCION_IIBB, regimen: 'CABA' },
  { pattern: 'percepcion iibb caba', tipo: TIPO_OBLIGACION.PERCEPCION_IIBB, regimen: 'CABA' },
  { pattern: 'percepciones iibb', tipo: TIPO_OBLIGACION.PERCEPCION_IIBB, regimen: 'CABA' },
];

/**
 * Resolves an AGIP concepto label to a TipoObligacion + regimen.
 * Returns null for non-IIBB concepts (ABL, Patentes, etc.).
 */
export function resolverConceptoAgip(raw: string): ConceptoResueltoAgip | null {
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

  for (const entry of CONCEPTO_MAP_AGIP) {
    if (normalized.includes(entry.pattern)) {
      return { tipo: entry.tipo, regimen: entry.regimen };
    }
  }

  return null;
}

/**
 * Parses a date string in DD/MM/YYYY format.
 */
export function parseFechaAgip(raw: string): { day: number; month: number; year: number } | null {
  const match = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  return { day, month, year };
}

export interface AgipParseResult {
  reglas: ReglaPropuestaScrapeada[];
  errores: string[];
  conceptosIgnorados: string[];
}

/**
 * Parses the AGIP vencimientos HTML and extracts ReglaPropuestaScrapeada[].
 *
 * @param html Full HTML content of the AGIP vencimientos page
 * @param mesFiscal Fiscal period month (1-12)
 * @param anioFiscal Fiscal period year
 * @param vigenciaDesde ISO date string for vigenciaDesde on produced reglas
 */
export function parseAgipVencimientosHtml(
  html: string,
  mesFiscal: number,
  anioFiscal: number,
  vigenciaDesde: string,
): AgipParseResult {
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
      const resuelto = resolverConceptoAgip(concepto);

      if (!resuelto) {
        conceptosIgnorados.push(concepto);
        continue;
      }

      for (let i = 0; i < 10; i++) {
        const terminacion = String(i);
        const parsed = parseFechaAgip(cells[i + 1]);

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
          jurisdiccion: JURISDICCION.AGIP,
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
