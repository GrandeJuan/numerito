import * as fs from 'fs';
import * as path from 'path';
import {
  parseArcaVencimientosHtml,
  resolverConcepto,
  parseFechaARCA,
  expandTerminaciones,
} from './arca-html-parser';
import { TIPO_OBLIGACION, JURISDICCION } from '@numerito/shared';

function loadFixture(name: string): string {
  return fs.readFileSync(path.join(__dirname, '__fixtures__', name), 'utf-8');
}

describe('ArcaHtmlParser', () => {
  describe('parseFechaARCA', () => {
    it('parses DD/MM/YYYY', () => {
      expect(parseFechaARCA('18/06/2026')).toEqual({ day: 18, month: 6, year: 2026 });
    });

    it('parses single-digit day/month', () => {
      expect(parseFechaARCA('5/1/2026')).toEqual({ day: 5, month: 1, year: 2026 });
    });

    it('returns null for invalid format', () => {
      expect(parseFechaARCA('2026-06-18')).toBeNull();
      expect(parseFechaARCA('abc')).toBeNull();
      expect(parseFechaARCA('')).toBeNull();
    });

    it('returns null for out-of-range values', () => {
      expect(parseFechaARCA('32/06/2026')).toBeNull();
      expect(parseFechaARCA('15/13/2026')).toBeNull();
      expect(parseFechaARCA('0/06/2026')).toBeNull();
    });
  });

  describe('expandTerminaciones', () => {
    it('expands "todos" to all 10 digits', () => {
      expect(expandTerminaciones('todos')).toEqual([
        '0',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
      ]);
    });

    it('expands "0-1-2-3" to 4 digits', () => {
      expect(expandTerminaciones('0-1-2-3')).toEqual(['0', '1', '2', '3']);
    });

    it('expands a single digit', () => {
      expect(expandTerminaciones('4')).toEqual(['4']);
    });

    it('dedupes repeated digits', () => {
      expect(expandTerminaciones('0-0-1')).toEqual(['0', '1']);
    });

    it('returns empty for unparseable input', () => {
      expect(expandTerminaciones('')).toEqual([]);
      expect(expandTerminaciones('---')).toEqual([]);
    });
  });

  describe('resolverConcepto', () => {
    it('maps IVA', () => {
      const r = resolverConcepto('IMPUESTO AL VALOR AGREGADO', 'Régimen General');
      expect(r.tipo).toBe(TIPO_OBLIGACION.IVA);
      expect(r.regimen).toMatch(/REGIMEN_GENERAL/);
    });

    it('maps Monotributo', () => {
      const r = resolverConcepto(
        'REGIMEN SIMPLIFICADO PARA PEQUEÑOS CONTRIBUYENTES - MONOTRIBUTO',
        'Régimen General',
      );
      expect(r.tipo).toBe(TIPO_OBLIGACION.MONOTRIBUTO);
    });

    it('maps SICOSS (seguridad social)', () => {
      const r = resolverConcepto(
        'REGIMENES NACIONALES DE LA SEGURIDAD SOCIAL Y OBRAS SOCIALES',
        'Régimen General',
      );
      expect(r.tipo).toBe(TIPO_OBLIGACION.SICOSS);
    });

    it('maps Ganancias', () => {
      const r = resolverConcepto('IMPUESTO A LAS GANANCIAS', 'Régimen General');
      expect(r.tipo).toBe(TIPO_OBLIGACION.DDJJ_GANANCIAS);
    });

    it('maps Bienes Personales', () => {
      const r = resolverConcepto('IMPUESTO SOBRE LOS BIENES PERSONALES', 'Régimen General');
      expect(r.tipo).toBe(TIPO_OBLIGACION.DDJJ_BIENES_PERSONALES);
    });

    it('falls back to OTRO for unmapped impuestos, preserving label in regimen', () => {
      const r = resolverConcepto('IMPUESTO A LAS APUESTAS DE CARRERA', 'Régimen General');
      expect(r.tipo).toBe(TIPO_OBLIGACION.OTRO);
      expect(r.regimen).toContain('APUESTAS');
    });
  });

  describe('parseArcaVencimientosHtml — real fixture', () => {
    const html = loadFixture('arca-vencimientos-2026-04.html');
    const result = parseArcaVencimientosHtml(html, 4, 2026, '2026-01-01');

    it('produces reglas', () => {
      expect(result.reglas.length).toBeGreaterThan(0);
    });

    it('all reglas have jurisdiccion ARCA', () => {
      for (const r of result.reglas) {
        expect(r.jurisdiccion).toBe(JURISDICCION.ARCA);
      }
    });

    it('all reglas have terminacionCuit in 0-9', () => {
      const valid = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
      for (const r of result.reglas) {
        expect(valid.has(r.terminacionCuit)).toBe(true);
      }
    });

    it('all reglas have valid diaVencimiento (1-31)', () => {
      for (const r of result.reglas) {
        expect(r.diaVencimiento).toBeGreaterThanOrEqual(1);
        expect(r.diaVencimiento).toBeLessThanOrEqual(31);
      }
    });

    it('detects at least one IVA regla', () => {
      const ivaReglas = result.reglas.filter((r) => r.tipoObligacion === TIPO_OBLIGACION.IVA);
      expect(ivaReglas.length).toBeGreaterThan(0);
    });

    it('detects at least one Monotributo regla', () => {
      const mt = result.reglas.filter((r) => r.tipoObligacion === TIPO_OBLIGACION.MONOTRIBUTO);
      expect(mt.length).toBeGreaterThan(0);
    });

    it('sets vigenciaDesde from parameter', () => {
      for (const r of result.reglas) {
        expect(r.vigenciaDesde).toBe('2026-01-01');
      }
    });

    it('reports unmapped impuestos in conceptosIgnorados', () => {
      // The page covers ~33 impuestos; ~6 are mapped, the rest fall back to OTRO
      // and are reported as ignorados for visibility.
      expect(result.conceptosIgnorados.length).toBeGreaterThan(0);
    });

    it('still produces reglas for OTRO-typed unmapped concepts', () => {
      const otros = result.reglas.filter((r) => r.tipoObligacion === TIPO_OBLIGACION.OTRO);
      expect(otros.length).toBeGreaterThan(0);
    });
  });

  describe('parseArcaVencimientosHtml — mesSiguiente', () => {
    it('marks a May date in a parsing of April period as mesSiguiente=true', () => {
      const html = `
        <table class="tabla-form-vencimientos">
          <tr><td class="grilla-titulo">Impuesto</td><td class="grilla-dato-titulo">IMPUESTO AL VALOR AGREGADO</td></tr>
          <tr><td class="grilla-titulo">Tipo de Régimen</td><td class="grilla-dato">Régimen General</td></tr>
          <tr><td class="td-obligacion-sin-borde">
            <table class="tabla-fecha">
              <tr><td class="titulo-fecha">Terminación de CUIT</td><td class="titulo-fecha">Fecha</td></tr>
              <tr><td class="td-fecha">0</td><td class="td-fecha">18/05/2026</td></tr>
            </table>
          </td></tr>
        </table>`;
      const result = parseArcaVencimientosHtml(html, 4, 2026, '2026-01-01');
      expect(result.reglas).toHaveLength(1);
      expect(result.reglas[0].mesSiguiente).toBe(true);
    });

    it('marks a December→January rollover as mesSiguiente=true', () => {
      const html = `
        <table class="tabla-form-vencimientos">
          <tr><td class="grilla-titulo">Impuesto</td><td class="grilla-dato-titulo">IMPUESTO AL VALOR AGREGADO</td></tr>
          <tr><td class="grilla-titulo">Tipo de Régimen</td><td class="grilla-dato">Régimen General</td></tr>
          <tr><td>
            <table class="tabla-fecha">
              <tr><td>Term</td><td>Fecha</td></tr>
              <tr><td>todos</td><td>18/01/2027</td></tr>
            </table>
          </td></tr>
        </table>`;
      const result = parseArcaVencimientosHtml(html, 12, 2026, '2026-01-01');
      expect(result.reglas).toHaveLength(10);
      for (const r of result.reglas) {
        expect(r.mesSiguiente).toBe(true);
      }
    });

    it('marks same-month dates as mesSiguiente=false', () => {
      const html = `
        <table class="tabla-form-vencimientos">
          <tr><td class="grilla-titulo">Impuesto</td><td class="grilla-dato-titulo">IMPUESTO AL VALOR AGREGADO</td></tr>
          <tr><td class="grilla-titulo">Tipo de Régimen</td><td class="grilla-dato">Régimen General</td></tr>
          <tr><td>
            <table class="tabla-fecha">
              <tr><td>Term</td><td>Fecha</td></tr>
              <tr><td>0-1-2-3</td><td>10/04/2026</td></tr>
            </table>
          </td></tr>
        </table>`;
      const result = parseArcaVencimientosHtml(html, 4, 2026, '2026-01-01');
      expect(result.reglas).toHaveLength(4);
      for (const r of result.reglas) {
        expect(r.mesSiguiente).toBe(false);
        expect(r.diaVencimiento).toBe(10);
      }
    });
  });

  describe('parseArcaVencimientosHtml — edge cases', () => {
    it('returns empty reglas for empty page', () => {
      const html = loadFixture('arca-vencimientos-empty.html');
      const result = parseArcaVencimientosHtml(html, 5, 2026, '2026-01-01');
      expect(result.reglas).toHaveLength(0);
      expect(result.errores).toHaveLength(0);
    });

    it('returns empty reglas for malformed page (no tables)', () => {
      const html = loadFixture('arca-vencimientos-malformed.html');
      const result = parseArcaVencimientosHtml(html, 5, 2026, '2026-01-01');
      expect(result.reglas).toHaveLength(0);
    });

    it('reports an error for an invalid date cell', () => {
      const html = `
        <table class="tabla-form-vencimientos">
          <tr><td class="grilla-titulo">Impuesto</td><td class="grilla-dato-titulo">IMPUESTO AL VALOR AGREGADO</td></tr>
          <tr><td class="grilla-titulo">Tipo de Régimen</td><td class="grilla-dato">Régimen General</td></tr>
          <tr><td>
            <table class="tabla-fecha">
              <tr><td>Term</td><td>Fecha</td></tr>
              <tr><td>0</td><td>not-a-date</td></tr>
            </table>
          </td></tr>
        </table>`;
      const result = parseArcaVencimientosHtml(html, 4, 2026, '2026-01-01');
      expect(result.reglas).toHaveLength(0);
      expect(result.errores.length).toBeGreaterThan(0);
    });
  });
});
