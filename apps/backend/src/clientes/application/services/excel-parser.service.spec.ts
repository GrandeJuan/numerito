import { ExcelParserService, type ParseResult } from './excel-parser.service';
import { TIPO_OBLIGACION } from '@numerito/shared';

describe('ExcelParserService', () => {
  let parser: ExcelParserService;

  beforeEach(() => {
    parser = new ExcelParserService();
  });

  const HEADERS = [
    'CLIENTE',    // 0  A
    'Responsable',// 1  B
    'CUIT',       // 2  C
    'SICOSS',     // 3  D
    'IVA',        // 4  E
    'REG INF.\nCYV', // 5  F
    'CITI CPRA',  // 6  G
    'L. DIGITAL IVA', // 7  H
    'SICORE',     // 8  V (simplified)
    'DETALLE',    // 9  AE
    'IIBB',       // 10 AG
    'BALANCE PDF',// 11 AQ
    'CALENDARIO', // 12 AR
  ];

  function makeRow(overrides: Record<number, unknown>): unknown[] {
    const row: unknown[] = new Array(HEADERS.length).fill(null);
    for (const [k, v] of Object.entries(overrides)) {
      row[Number(k)] = v;
    }
    return row;
  }

  it('should return empty result for empty input', () => {
    const result = parser.parse([]);
    expect(result.rows).toEqual([]);
    expect(result.errores).toContain('Archivo vacío o sin datos');
  });

  it('should return empty result for header-only file', () => {
    const result = parser.parse([HEADERS]);
    expect(result.rows).toEqual([]);
    expect(result.errores).toEqual([]);
  });

  it('should parse a basic row with datetime values', () => {
    const fecha = new Date('2026-02-18');
    const row = makeRow({
      0: 'MAFISSA',
      1: 'LORENA',
      2: 0,
      4: fecha, // IVA
      12: 'SI',
    });

    const result = parser.parse([HEADERS, row]);
    expect(result.rows).toHaveLength(1);

    const parsed = result.rows[0];
    expect(parsed.razonSocial).toBe('MAFISSA');
    expect(parsed.responsable).toBe('LORENA');
    expect(parsed.cuitTerminacion).toBe(0);
    expect(parsed.calendario).toBe(true);
    expect(parsed.obligaciones).toHaveLength(1);
    expect(parsed.obligaciones[0].tipoObligacion).toBe(TIPO_OBLIGACION.IVA);
    expect(parsed.obligaciones[0].fecha).toEqual(fecha);
  });

  it('should parse multiple obligations per row', () => {
    const fechaIva = new Date('2026-02-18');
    const fechaSicoss = new Date('2026-02-09');
    const fechaBalance = new Date('2025-06-30');
    const row = makeRow({
      0: 'GUILLERMO PINI SRL',
      1: 'LORENA',
      2: 1,
      3: fechaSicoss,
      4: fechaIva,
      11: fechaBalance,
      12: 'SI',
    });

    const result = parser.parse([HEADERS, row]);
    expect(result.rows[0].obligaciones).toHaveLength(3);

    const tipos = result.rows[0].obligaciones.map((o) => o.tipoObligacion);
    expect(tipos).toContain(TIPO_OBLIGACION.SICOSS);
    expect(tipos).toContain(TIPO_OBLIGACION.IVA);
    expect(tipos).toContain(TIPO_OBLIGACION.PRESENTACION_BALANCES);
  });

  it('should skip empty rows (no client name)', () => {
    const row1 = makeRow({ 0: 'CLIENT A', 1: 'LORENA', 4: new Date('2026-02-18') });
    const emptyRow = makeRow({});
    const row2 = makeRow({ 0: 'CLIENT B', 1: 'MARIA', 4: new Date('2026-03-18') });

    const result = parser.parse([HEADERS, row1, emptyRow, row2]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].razonSocial).toBe('CLIENT A');
    expect(result.rows[1].razonSocial).toBe('CLIENT B');
  });

  it('should handle #REF! error values gracefully', () => {
    const row = makeRow({
      0: 'TEST CLIENT',
      1: 'LORENA',
      4: new Date('2026-02-18'),
      5: '#REF!',
    });

    const result = parser.parse([HEADERS, row]);
    expect(result.rows[0].obligaciones).toHaveLength(1); // only IVA, not REG INF
    expect(result.errores).toHaveLength(1);
    expect(result.errores[0]).toContain('#REF!');
  });

  it('should skip text values in obligation columns (e.g. "10 y 24/2")', () => {
    const row = makeRow({
      0: 'TEST CLIENT',
      1: 'LORENA',
      8: '9 y 20/2', // SICORE column with text value
    });

    const result = parser.parse([HEADERS, row]);
    expect(result.rows[0].obligaciones).toHaveLength(0);
  });

  it('should categorize recognized vs ignored headers', () => {
    const result = parser.parse([HEADERS, makeRow({ 0: 'X' })]);

    expect(result.headersReconocidos).toContain('CLIENTE');
    expect(result.headersReconocidos).toContain('IVA');
    expect(result.headersReconocidos).toContain('SICOSS');
    expect(result.headersReconocidos).toContain('BALANCE PDF');
  });

  it('should handle "NO" for calendario', () => {
    const row = makeRow({ 0: 'CLIENT', 12: 'NO' });
    const result = parser.parse([HEADERS, row]);
    expect(result.rows[0].calendario).toBe(false);
  });

  it('should handle null calendario as false', () => {
    const row = makeRow({ 0: 'CLIENT' });
    const result = parser.parse([HEADERS, row]);
    expect(result.rows[0].calendario).toBe(false);
  });

  it('should preserve row numbers for error tracking', () => {
    const row1 = makeRow({ 0: 'CLIENT A' });
    const row2 = makeRow({ 0: 'CLIENT B' });

    const result = parser.parse([HEADERS, row1, row2]);
    expect(result.rows[0].fila).toBe(2); // row 2 in Excel (1-indexed, header is row 1)
    expect(result.rows[1].fila).toBe(3);
  });

  it('should parse DETALLE column as metadata', () => {
    const row = makeRow({ 0: 'CLIENT', 9: 'CONV MULT' });
    const result = parser.parse([HEADERS, row]);
    expect(result.rows[0].detalle).toBe('CONV MULT');
  });

  it('should map REG INF CYV header to CITI_VENTAS', () => {
    const fecha = new Date('2020-11-18');
    const row = makeRow({ 0: 'CLIENT', 5: fecha });
    const result = parser.parse([HEADERS, row]);
    expect(result.rows[0].obligaciones[0].tipoObligacion).toBe(TIPO_OBLIGACION.CITI_VENTAS);
  });

  it('should handle multiple rows with varied data', () => {
    const rows = [
      HEADERS,
      makeRow({ 0: 'MAFISSA', 1: 'LORENA', 2: 0, 3: new Date('2026-02-09'), 12: 'SI' }),
      makeRow({ 0: 'JUAN GRANDE', 1: 'LORENA', 2: 0, 10: new Date('2026-02-18'), 12: 'NO' }),
      makeRow({ 0: 'YDYL', 1: 'LORENA', 2: 1, 4: new Date('2026-02-18') }),
    ];

    const result = parser.parse(rows);
    expect(result.rows).toHaveLength(3);
    expect(result.rows[0].obligaciones).toHaveLength(1); // SICOSS
    expect(result.rows[1].obligaciones).toHaveLength(1); // IIBB
    expect(result.rows[2].obligaciones).toHaveLength(1); // IVA
  });
});
