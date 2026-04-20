/**
 * Pure HTML parser for BCRA feriados bancarios page.
 *
 * Extracts feriado data from the HTML published by bcra.gob.ar.
 * Separated from browser automation (Playwright) so it can be tested
 * independently against HTML fixtures.
 *
 * The BCRA page renders a single table with columns:
 * Fecha | Día | Motivo | Tipo
 *
 * Feriado types are classified as:
 * - "Feriado Nacional" / "Feriado Nacional (trasladado)" → NACIONAL
 * - "Feriado Bancario" → BANCARIO
 *
 * BCRA publishes this annually. The scraper runs with cadencia 30d
 * to detect mid-year corrections.
 */

import { TIPO_FERIADO } from '@numerito/shared';
import type { TipoFeriado } from '@numerito/shared';
import type { FeriadoPropuestoScrapeado } from '../../domain/ports/calendario-scraper.port';

/**
 * Parses a date in DD/MM/YYYY format and returns ISO date string.
 */
export function parseFechaBcra(raw: string): string | null {
  const match = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Classifies the "Tipo" column text into a TipoFeriado.
 * Returns null for unrecognized types.
 */
export function clasificarTipoFeriado(raw: string): TipoFeriado | null {
  const normalized = raw.toLowerCase().trim();

  if (normalized.includes('feriado bancario')) {
    return TIPO_FERIADO.BANCARIO;
  }
  if (normalized.includes('feriado nacional')) {
    return TIPO_FERIADO.NACIONAL;
  }
  if (normalized.includes('feriado provincial')) {
    return TIPO_FERIADO.PROVINCIAL;
  }

  return null;
}

export interface BcraFeriadosParseResult {
  feriados: FeriadoPropuestoScrapeado[];
  errores: string[];
}

/**
 * Parses the BCRA feriados bancarios HTML and extracts FeriadoPropuestoScrapeado[].
 *
 * Expects a table with at least 3 columns: Fecha, Motivo/Descripcion, Tipo.
 * The "Día" column (day of week) is optional and ignored.
 *
 * @param html Full HTML content of the BCRA feriados page
 */
export function parseBcraFeriadosHtml(html: string): BcraFeriadosParseResult {
  const feriados: FeriadoPropuestoScrapeado[] = [];
  const errores: string[] = [];

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

      if (cells.length < 3) {
        if (cells.length > 0) {
          errores.push(
            `Fila con ${cells.length} celdas (se esperan al menos 3): "${cells[0]}"`,
          );
        }
        continue;
      }

      // BCRA table: Fecha | Día | Motivo | Tipo (4 cols)
      // or: Fecha | Motivo | Tipo (3 cols)
      const fechaRaw = cells[0];
      let descripcion: string;
      let tipoRaw: string;

      if (cells.length >= 4) {
        // 4+ columns: Fecha | Día | Motivo | Tipo
        descripcion = cells[2];
        tipoRaw = cells[3];
      } else {
        // 3 columns: Fecha | Motivo | Tipo
        descripcion = cells[1];
        tipoRaw = cells[2];
      }

      const fecha = parseFechaBcra(fechaRaw);
      if (!fecha) {
        errores.push(`No se pudo parsear fecha: "${fechaRaw}"`);
        continue;
      }

      const tipo = clasificarTipoFeriado(tipoRaw);
      if (!tipo) {
        errores.push(`Tipo de feriado no reconocido: "${tipoRaw}" (fecha: ${fecha})`);
        continue;
      }

      feriados.push({
        fecha,
        tipo,
        descripcion,
        jurisdiccionAfectada: null, // NACIONAL and BANCARIO affect all jurisdictions
      });
    }
  }

  return { feriados, errores };
}
