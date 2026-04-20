import { TIPO_OBLIGACION } from '@numerito/shared';
import type { TipoObligacion } from '@numerito/shared';

/**
 * Mapping from Excel column header text (normalized) to TipoObligacion.
 * Headers are normalized: trimmed, lowercased, newlines replaced with spaces.
 */
const HEADER_TO_TIPO: Record<string, TipoObligacion> = {
  'sicoss': TIPO_OBLIGACION.SICOSS,
  'iva': TIPO_OBLIGACION.IVA,
  'reg inf. cyv': TIPO_OBLIGACION.CITI_VENTAS,
  'reg inf. c y v': TIPO_OBLIGACION.CITI_VENTAS,
  'citi cpra': TIPO_OBLIGACION.CITI_COMPRAS,
  'l. digital iva': TIPO_OBLIGACION.LIBRO_IVA_DIGITAL,
  'iva dif.': TIPO_OBLIGACION.IVA,
  'ant gcias': TIPO_OBLIGACION.GANANCIAS,
  'ant. ph': TIPO_OBLIGACION.BIENES_PERSONALES,
  'op. internacionales': TIPO_OBLIGACION.OTRO,
  'dj ganancias': TIPO_OBLIGACION.DDJJ_GANANCIAS,
  'acc y bs. part.': TIPO_OBLIGACION.DDJJ_BIENES_PERSONALES,
  'ret iibb pba': TIPO_OBLIGACION.RETENCION_IIBB,
  'per iibb pba': TIPO_OBLIGACION.PERCEPCION_IIBB,
  'arciba caba': TIPO_OBLIGACION.IIBB_AGIP,
  'sicore': TIPO_OBLIGACION.SICORE,
  'ret sijp': TIPO_OBLIGACION.SUSS,
  'ret. sire': TIPO_OBLIGACION.SIRE,
  'iibb': TIPO_OBLIGACION.IIBB_ARBA,
  'iibb agip anual': TIPO_OBLIGACION.IIBB_AGIP,
  'anual iibb arba': TIPO_OBLIGACION.IIBB_ARBA,
  'dj gmp': TIPO_OBLIGACION.OTRO,
  'cert no ret': TIPO_OBLIGACION.OTRO,
  'cm05': TIPO_OBLIGACION.IIBB_CONVENIO_MULTILATERAL,
  'anual reg simp': TIPO_OBLIGACION.OTRO,
  'seg e higiene': TIPO_OBLIGACION.OTRO,
  'bs. y acc': TIPO_OBLIGACION.DDJJ_BIENES_PERSONALES,
  'part. societarias': TIPO_OBLIGACION.OTRO,
  'balance pdf': TIPO_OBLIGACION.PRESENTACION_BALANCES,
};

/** Columns that are metadata, not obligations */
const META_HEADERS = new Set([
  'cliente',
  'responsable',
  'cuit',
  'cuit/dv',
  'detalle',
  'calendario',
]);

export interface ObligacionImportada {
  tipoObligacion: TipoObligacion;
  headerOriginal: string;
  fecha: Date;
}

export interface ImportRow {
  fila: number;
  razonSocial: string;
  responsable: string | null;
  cuitTerminacion: number | null;
  detalle: string | null;
  calendario: boolean;
  obligaciones: ObligacionImportada[];
}

export interface ParseResult {
  rows: ImportRow[];
  headersReconocidos: string[];
  headersIgnorados: string[];
  errores: string[];
}

interface ColumnMapping {
  index: number;
  headerOriginal: string;
  tipo: TipoObligacion | null;
  meta: 'cliente' | 'responsable' | 'cuit' | 'detalle' | 'calendario' | 'cuit_dv' | null;
}

function normalizeHeader(header: string): string {
  return header
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function isDateValue(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

function isErrorValue(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.startsWith('#REF') || value.startsWith('#N/A') || value.startsWith('#VALUE');
  }
  return false;
}

/**
 * Parses the studio's historical Excel spreadsheet ("Vtos mensuales por responsable.xlsx")
 * into structured import rows.
 *
 * Expected format: Row 1 = headers, Row 2+ = client data.
 * Obligation columns contain dates (Date objects) for when the obligation is due.
 * Text-only cells (e.g. "10 y 24/2") and #REF! errors are skipped.
 */
export class ExcelParserService {
  /**
   * Parse a worksheet's raw data (array of arrays) into ImportRows.
   * Accepts the output of XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, dateNF: ... })
   * or equivalent row-array format where row[0] is headers.
   */
  parse(rows: unknown[][]): ParseResult {
    if (!rows || rows.length < 2) {
      return { rows: [], headersReconocidos: [], headersIgnorados: [], errores: ['Archivo vacío o sin datos'] };
    }

    const headerRow = rows[0];
    const mappings = this.buildColumnMappings(headerRow);
    const headersReconocidos: string[] = [];
    const headersIgnorados: string[] = [];

    for (const m of mappings) {
      if (m.tipo || m.meta) {
        headersReconocidos.push(m.headerOriginal);
      } else {
        headersIgnorados.push(m.headerOriginal);
      }
    }

    const errores: string[] = [];
    const parsedRows: ImportRow[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const clienteCol = mappings.find((m) => m.meta === 'cliente');
      const razonSocial = clienteCol ? this.cellToString(row[clienteCol.index]) : null;
      if (!razonSocial) continue; // skip empty rows

      const responsableCol = mappings.find((m) => m.meta === 'responsable');
      const cuitCol = mappings.find((m) => m.meta === 'cuit');
      const detalleCol = mappings.find((m) => m.meta === 'detalle');
      const calendarioCol = mappings.find((m) => m.meta === 'calendario');

      const responsable = responsableCol ? this.cellToString(row[responsableCol.index]) : null;
      const cuitTerminacion = cuitCol ? this.cellToNumber(row[cuitCol.index]) : null;
      const detalle = detalleCol ? this.cellToString(row[detalleCol.index]) : null;
      const calendarioVal = calendarioCol ? this.cellToString(row[calendarioCol.index]) : null;
      const calendario = calendarioVal?.toUpperCase() === 'SI';

      const obligaciones: ObligacionImportada[] = [];

      for (const mapping of mappings) {
        if (!mapping.tipo) continue;
        const cellValue = row[mapping.index];
        if (cellValue == null || cellValue === '') continue;
        if (isErrorValue(cellValue)) {
          errores.push(`Fila ${i + 1}, columna "${mapping.headerOriginal}": valor de error "${cellValue}" ignorado`);
          continue;
        }

        const fecha = this.parseDate(cellValue);
        if (!fecha) continue; // skip non-date text values

        obligaciones.push({
          tipoObligacion: mapping.tipo,
          headerOriginal: mapping.headerOriginal,
          fecha,
        });
      }

      parsedRows.push({
        fila: i + 1,
        razonSocial: razonSocial.trim(),
        responsable: responsable?.trim() ?? null,
        cuitTerminacion,
        detalle: detalle?.trim() ?? null,
        calendario,
        obligaciones,
      });
    }

    return { rows: parsedRows, headersReconocidos, headersIgnorados, errores };
  }

  private buildColumnMappings(headerRow: unknown[]): ColumnMapping[] {
    const mappings: ColumnMapping[] = [];

    for (let i = 0; i < headerRow.length; i++) {
      const raw = headerRow[i];
      if (raw == null || raw === '') continue;

      const headerOriginal = String(raw).trim();
      const normalized = normalizeHeader(headerOriginal);

      let meta: ColumnMapping['meta'] = null;
      let tipo: TipoObligacion | null = null;

      if (normalized === 'cliente') {
        meta = 'cliente';
      } else if (normalized === 'responsable') {
        meta = 'responsable';
      } else if (normalized === 'cuit' && i < 5) {
        // First CUIT column (column C) is the termination digit
        meta = 'cuit';
      } else if (normalized === 'cuit/dv') {
        meta = 'cuit_dv';
      } else if (normalized === 'detalle') {
        meta = 'detalle';
      } else if (normalized === 'calendario') {
        meta = 'calendario';
      } else if (!META_HEADERS.has(normalized)) {
        tipo = HEADER_TO_TIPO[normalized] ?? null;
      }

      mappings.push({ index: i, headerOriginal, tipo, meta });
    }

    return mappings;
  }

  private parseDate(value: unknown): Date | null {
    if (isDateValue(value)) return value;
    if (typeof value === 'number') {
      // Excel serial date number
      const date = this.excelSerialToDate(value);
      return isDateValue(date) ? date : null;
    }
    // Don't parse text values like "10 y 24/2" — too ambiguous
    return null;
  }

  private excelSerialToDate(serial: number): Date {
    // Excel serial date: days since 1900-01-01 (with 1900 leap year bug)
    const utcDays = serial - 25569; // offset to Unix epoch
    return new Date(utcDays * 86400000);
  }

  private cellToString(value: unknown): string | null {
    if (value == null) return null;
    const str = String(value).trim();
    return str.length > 0 ? str : null;
  }

  private cellToNumber(value: unknown): number | null {
    if (value == null) return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
  }
}
