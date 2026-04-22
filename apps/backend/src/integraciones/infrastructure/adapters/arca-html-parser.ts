/**
 * Pure HTML parser for ARCA vencimientos pages (seti.afip.gob.ar/av/).
 *
 * The real page is a form-driven Struts app. After POSTing the form to
 * /av/viewVencimientos.do with fechaVDesde/Hasta + terminacionCuit=Todos
 * + impuestosSeleccionados=999 (TODOS), the server returns a long list of
 * `<table class="tabla-form-vencimientos">` blocks — one per impuesto +
 * régimen combination. Each block has labeled rows:
 *
 *   Impuesto               | IMPUESTO AL VALOR AGREGADO
 *   Descripción del Régimen| (optional, qualifies the impuesto)
 *   Sujeto                 | ...
 *   Tipo de Régimen        | Régimen General / Anticipos / Información / ...
 *   Tipo de obligación     | (one or more <div class="Estilo1"> labels)
 *
 * followed by one or more nested `<table class="tabla-fecha">` with rows
 * like `Terminación de CUIT | Fecha de Vencimiento`. The terminación cell
 * can be `todos`, a single digit, or a range like `0-1-2-3` / `4-5-6`.
 */

import { TIPO_OBLIGACION, JURISDICCION } from '@numerito/shared';
import type { TipoObligacion } from '@numerito/shared';
import type { ReglaPropuestaScrapeada } from '../../domain/ports/calendario-scraper.port';

// ── Concepto resolution ──

export interface ConceptoResuelto {
  tipo: TipoObligacion;
  regimen: string;
}

/**
 * Maps the "Impuesto" label (normalized: lowercase, no accents) to a
 * TipoObligacion. Regimen is built from the block's "Tipo de Régimen" and
 * "Descripción del Régimen" downstream. Unmapped impuestos fall back to
 * TIPO_OBLIGACION.OTRO so the proposal surfaces for admin review.
 */
const IMPUESTO_MAP: Array<{ pattern: string; tipo: TipoObligacion }> = [
  { pattern: 'impuesto al valor agregado', tipo: TIPO_OBLIGACION.IVA },
  {
    pattern: 'regimen simplificado para pequenos contribuyentes',
    tipo: TIPO_OBLIGACION.MONOTRIBUTO,
  },
  { pattern: 'monotributo', tipo: TIPO_OBLIGACION.MONOTRIBUTO },
  { pattern: 'regimenes nacionales de la seguridad social', tipo: TIPO_OBLIGACION.SICOSS },
  { pattern: 'impuesto a las ganancias', tipo: TIPO_OBLIGACION.DDJJ_GANANCIAS },
  { pattern: 'impuesto sobre los bienes personales', tipo: TIPO_OBLIGACION.DDJJ_BIENES_PERSONALES },
];

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function normalizeForMatch(s: string): string {
  return stripDiacritics(s).toLowerCase().replace(/\s+/g, ' ').trim();
}

export function resolverConcepto(impuesto: string, tipoRegimen: string): ConceptoResuelto {
  const normImpuesto = normalizeForMatch(impuesto);
  for (const entry of IMPUESTO_MAP) {
    if (normImpuesto.includes(entry.pattern)) {
      return { tipo: entry.tipo, regimen: slugRegimen(tipoRegimen || 'GENERAL') };
    }
  }
  // Unmapped impuesto — preserve the original label in the regimen so
  // the admin can decide how to classify it.
  return {
    tipo: TIPO_OBLIGACION.OTRO,
    regimen: slugRegimen(impuesto + (tipoRegimen ? ' / ' + tipoRegimen : '')),
  };
}

function slugRegimen(s: string): string {
  return (
    stripDiacritics(s)
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80) || 'GENERAL'
  );
}

// ── Date + terminación parsing ──

export function parseFechaARCA(raw: string): { day: number; month: number; year: number } | null {
  const match = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  return { day, month, year };
}

/**
 * Expands a terminación cell to individual CUIT terminaciones.
 *   "todos"     → ["0","1","2","3","4","5","6","7","8","9"]
 *   "0-1-2-3"   → ["0","1","2","3"]
 *   "4"         → ["4"]
 *   "0,1,2"     → ["0","1","2"]
 * Returns [] if unparseable.
 */
export function expandTerminaciones(raw: string): string[] {
  const s = normalizeForMatch(raw);
  if (!s) return [];
  if (s === 'todos') return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const digits = s.match(/\d/g);
  if (!digits) return [];
  return Array.from(new Set(digits));
}

// ── HTML helpers ──

const ENTITY_MAP: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&aacute;': 'á',
  '&eacute;': 'é',
  '&iacute;': 'í',
  '&oacute;': 'ó',
  '&uacute;': 'ú',
  '&ntilde;': 'ñ',
  '&Aacute;': 'Á',
  '&Eacute;': 'É',
  '&Iacute;': 'Í',
  '&Oacute;': 'Ó',
  '&Uacute;': 'Ú',
  '&Ntilde;': 'Ñ',
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&[a-zA-Z]+;/g, (m) => ENTITY_MAP[m] ?? m);
}

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, '');
}

function cellText(s: string): string {
  return decodeEntities(stripTags(s)).replace(/\s+/g, ' ').trim();
}

/**
 * Given the full HTML and the index *right after* a `<table` opening tag,
 * returns the index right after the matching `</table>`. Handles nested
 * tables via depth counting. Returns -1 if no match.
 */
function findMatchingTableEnd(html: string, afterOpenTagIdx: number): number {
  let depth = 1;
  const i = afterOpenTagIdx;
  const re = /<(\/?)table\b/gi;
  re.lastIndex = i;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (m[1] === '/') {
      depth--;
      if (depth === 0) {
        return m.index + m[0].length + html.slice(m.index + m[0].length).indexOf('>') + 1;
      }
    } else {
      depth++;
    }
  }
  return -1;
}

function extractTopLevelBlocks(html: string): string[] {
  const blocks: string[] = [];
  const openRe = /<table[^>]*class="[^"]*tabla-form-vencimientos[^"]*"[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = openRe.exec(html)) !== null) {
    const start = m.index;
    const afterOpen = m.index + m[0].length;
    const end = findMatchingTableEnd(html, afterOpen);
    if (end === -1) continue;
    blocks.push(html.slice(start, end));
    openRe.lastIndex = end;
  }
  return blocks;
}

interface RowKV {
  label: string;
  value: string;
}

/**
 * Parses the top-level rows of a tabla-form-vencimientos block, where
 * each <tr> has <td class="grilla-titulo">LABEL</td><td class="grilla-dato[-titulo]">VALUE</td>.
 * Nested tables inside VALUE cells are stripped.
 */
function extractLabeledRows(blockHtml: string): RowKV[] {
  const rows: RowKV[] = [];
  // Match only top-level <tr> of the outer table, not nested tabla-fecha rows.
  // Approach: remove nested <table>...</table> blocks first.
  const withoutNested = removeNestedTables(blockHtml);
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let m: RegExpExecArray | null;
  while ((m = trRe.exec(withoutNested)) !== null) {
    const tdRe = /<td[^>]*class="([^"]*)"[^>]*>([\s\S]*?)<\/td>/gi;
    const tds: Array<{ cls: string; text: string }> = [];
    let t: RegExpExecArray | null;
    while ((t = tdRe.exec(m[1])) !== null) {
      tds.push({ cls: t[1], text: cellText(t[2]) });
    }
    if (tds.length < 2) continue;
    const first = tds[0];
    const second = tds[1];
    if (first.cls.includes('grilla-titulo') || first.cls.includes('grilla-titulo-inf')) {
      rows.push({ label: first.text, value: second.text });
    }
  }
  return rows;
}

function removeNestedTables(html: string): string {
  // Repeatedly strip innermost <table>...</table> occurrences until none
  // remain inside the outer block's rows.
  const result = html;
  // Strip only nested tables (keep the outer one). Easiest: find the outer
  // table's opening+closing and work on its inner content.
  const openIdx = result.indexOf('<table');
  if (openIdx === -1) return result;
  const outerOpenEnd = result.indexOf('>', openIdx) + 1;
  const outerEnd = findMatchingTableEnd(result, outerOpenEnd);
  if (outerEnd === -1) return result;
  const outerCloseIdx = result.lastIndexOf('</table>', outerEnd);
  let inner = result.slice(outerOpenEnd, outerCloseIdx);
  // Strip nested tables from inner
  // Replace each nested <table ...>...</table> with empty.
  while (true) {
    const nestedOpen = inner.search(/<table\b/i);
    if (nestedOpen === -1) break;
    const nestedAfterOpen = inner.indexOf('>', nestedOpen) + 1;
    const nestedEnd = findMatchingTableEnd(inner, nestedAfterOpen);
    if (nestedEnd === -1) break;
    inner = inner.slice(0, nestedOpen) + inner.slice(nestedEnd);
  }
  return result.slice(0, outerOpenEnd) + inner + result.slice(outerCloseIdx);
}

function extractTablaFechas(
  blockHtml: string,
): Array<{ detalle: string; filas: Array<{ terminacion: string; fecha: string }> }> {
  const result: Array<{ detalle: string; filas: Array<{ terminacion: string; fecha: string }> }> =
    [];
  const tablaRe = /<table[^>]*class="[^"]*tabla-fecha[^"]*"[^>]*>([\s\S]*?)<\/table>/gi;
  let m: RegExpExecArray | null;
  while ((m = tablaRe.exec(blockHtml)) !== null) {
    const contenido = m[1];
    // Find the most recent preceding <div class="Estilo1">LABEL</div> to
    // use as detalle for this tabla-fecha.
    const beforeHtml = blockHtml.slice(0, m.index);
    const detalleMatches = Array.from(
      beforeHtml.matchAll(/<div[^>]*class="[^"]*Estilo1[^"]*"[^>]*>([\s\S]*?)<\/div>/gi),
    );
    const detalle =
      detalleMatches.length > 0 ? cellText(detalleMatches[detalleMatches.length - 1][1]) : '';

    const filas: Array<{ terminacion: string; fecha: string }> = [];
    const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let trMatch: RegExpExecArray | null;
    let firstRow = true;
    while ((trMatch = trRe.exec(contenido)) !== null) {
      const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const tds: string[] = [];
      let td: RegExpExecArray | null;
      while ((td = tdRe.exec(trMatch[1])) !== null) {
        tds.push(cellText(td[1]));
      }
      if (firstRow) {
        firstRow = false;
        continue; // Skip the header row (Terminación de CUIT | Fecha de Vencimiento)
      }
      if (tds.length < 2) continue;
      filas.push({ terminacion: tds[0], fecha: tds[1] });
    }
    result.push({ detalle, filas });
  }
  return result;
}

// ── Main parse ──

export interface ArcaParseResult {
  reglas: ReglaPropuestaScrapeada[];
  errores: string[];
  conceptosIgnorados: string[];
}

/**
 * Parses the ARCA vencimientos result HTML (response of the POST to
 * /av/viewVencimientos.do) and extracts ReglaPropuestaScrapeada[].
 *
 * @param html        Full HTML content of the ARCA result page
 * @param mesFiscal   Fiscal period month (1-12)
 * @param anioFiscal  Fiscal period year
 * @param vigenciaDesde ISO date string for vigenciaDesde on produced reglas
 */
export function parseArcaVencimientosHtml(
  html: string,
  mesFiscal: number,
  _anioFiscal: number,
  vigenciaDesde: string,
): ArcaParseResult {
  const reglas: ReglaPropuestaScrapeada[] = [];
  const errores: string[] = [];
  const conceptosIgnorados: string[] = [];

  const blocks = extractTopLevelBlocks(html);

  for (const block of blocks) {
    const rows = extractLabeledRows(block);
    const impuesto = rows.find((r) => /^\s*impuesto\s*$/i.test(r.label))?.value ?? '';
    const tipoRegimen = rows.find((r) => /tipo de r[eé]gimen/i.test(r.label))?.value ?? '';
    const descripcionRegimen =
      rows.find((r) => /descripci[oó]n del r[eé]gimen/i.test(r.label))?.value ?? '';

    if (!impuesto) {
      errores.push('Bloque sin impuesto detectado');
      continue;
    }

    const tablas = extractTablaFechas(block);
    if (tablas.length === 0) continue;

    const resuelto = resolverConcepto(impuesto, tipoRegimen);
    if (resuelto.tipo === TIPO_OBLIGACION.OTRO) {
      conceptosIgnorados.push(impuesto);
    }

    const needsDetalleSuffix = tablas.length > 1;

    for (const tabla of tablas) {
      const regimen = buildRegimen(
        resuelto.regimen,
        descripcionRegimen,
        tabla.detalle,
        needsDetalleSuffix,
      );

      for (const fila of tabla.filas) {
        const parsedFecha = parseFechaARCA(fila.fecha);
        if (!parsedFecha) {
          errores.push(
            `Fecha inválida para ${impuesto} / ${tipoRegimen} (term. ${fila.terminacion}): "${fila.fecha}"`,
          );
          continue;
        }
        const terminaciones = expandTerminaciones(fila.terminacion);
        if (terminaciones.length === 0) {
          errores.push(
            `Terminación no reconocida para ${impuesto} / ${tipoRegimen}: "${fila.terminacion}"`,
          );
          continue;
        }
        const mesSiguiente =
          parsedFecha.month > mesFiscal || (parsedFecha.month === 1 && mesFiscal === 12);
        for (const term of terminaciones) {
          reglas.push({
            tipoObligacion: resuelto.tipo,
            jurisdiccion: JURISDICCION.ARCA,
            regimen,
            terminacionCuit: term,
            diaVencimiento: parsedFecha.day,
            mesSiguiente,
            vigenciaDesde,
            vigenciaHasta: null,
          });
        }
      }
    }
  }

  return { reglas, errores, conceptosIgnorados };
}

function buildRegimen(
  baseRegimen: string,
  descripcion: string,
  detalle: string,
  includeDetalle: boolean,
): string {
  const parts = [baseRegimen];
  if (descripcion) parts.push(slugRegimen(descripcion));
  if (includeDetalle && detalle) parts.push(slugRegimen(detalle));
  return parts.filter(Boolean).join('__');
}
