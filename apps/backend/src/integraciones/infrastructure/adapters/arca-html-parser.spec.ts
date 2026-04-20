import * as fs from 'fs';
import * as path from 'path';
import {
  parseArcaVencimientosHtml,
  resolverConcepto,
  parseFechaARCA,
} from './arca-html-parser';
import { TIPO_OBLIGACION, JURISDICCION } from '@numerito/shared';

function loadFixture(name: string): string {
  return fs.readFileSync(
    path.join(__dirname, '__fixtures__', name),
    'utf-8',
  );
}

describe('ArcaHtmlParser', () => {
  describe('parseFechaARCA', () => {
    it('should parse a valid DD/MM/YYYY date', () => {
      expect(parseFechaARCA('18/06/2026')).toEqual({ day: 18, month: 6, year: 2026 });
    });

    it('should parse single-digit day/month', () => {
      expect(parseFechaARCA('5/1/2026')).toEqual({ day: 5, month: 1, year: 2026 });
    });

    it('should return null for invalid format', () => {
      expect(parseFechaARCA('2026-06-18')).toBeNull();
      expect(parseFechaARCA('abc')).toBeNull();
      expect(parseFechaARCA('')).toBeNull();
    });

    it('should return null for out-of-range values', () => {
      expect(parseFechaARCA('32/06/2026')).toBeNull();
      expect(parseFechaARCA('15/13/2026')).toBeNull();
      expect(parseFechaARCA('0/06/2026')).toBeNull();
    });
  });

  describe('resolverConcepto', () => {
    it('should map IVA DJ Mensual', () => {
      const result = resolverConcepto('IVA - DJ Mensual (F.2002)');
      expect(result).toEqual({ tipo: TIPO_OBLIGACION.IVA, regimen: 'GENERAL' });
    });

    it('should map Libro de IVA Digital', () => {
      const result = resolverConcepto('Libro de IVA Digital');
      expect(result).toEqual({ tipo: TIPO_OBLIGACION.LIBRO_IVA_DIGITAL, regimen: 'GENERAL' });
    });

    it('should map SICOSS (F.931)', () => {
      const result = resolverConcepto('SICOSS (F.931)');
      expect(result).toEqual({ tipo: TIPO_OBLIGACION.SICOSS, regimen: 'GENERAL' });
    });

    it('should map Monotributo', () => {
      const result = resolverConcepto('Monotributo - Componente Impositivo');
      expect(result).toEqual({ tipo: TIPO_OBLIGACION.MONOTRIBUTO, regimen: 'MONOTRIBUTO' });
    });

    it('should map SICORE Retenciones', () => {
      const result = resolverConcepto('SICORE - Retenciones (F.997/F.2170)');
      expect(result).toEqual({ tipo: TIPO_OBLIGACION.SICORE, regimen: 'GENERAL' });
    });

    it('should map SIRE', () => {
      const result = resolverConcepto('SIRE - Retenciones y Percepciones');
      expect(result).toEqual({ tipo: TIPO_OBLIGACION.SIRE, regimen: 'GENERAL' });
    });

    it('should map Ganancias Sociedades', () => {
      const result = resolverConcepto('Ganancias Sociedades - DJ Anual (F.713)');
      expect(result).toEqual({ tipo: TIPO_OBLIGACION.DDJJ_GANANCIAS, regimen: 'SOCIEDADES' });
    });

    it('should return null for unknown concepto', () => {
      expect(resolverConcepto('Impuesto Desconocido XYZ')).toBeNull();
    });
  });

  describe('parseArcaVencimientosHtml', () => {
    it('should parse the main fixture with IVA + SICOSS + other obligations', () => {
      const html = loadFixture('arca-vencimientos-iva-2026-05.html');
      const result = parseArcaVencimientosHtml(html, 5, 2026, '2026-01-01');

      // 6 conceptos × 10 terminaciones = 60 rules + 1 ganancias concepto × 10 = 10
      // Total: 70 rules
      expect(result.reglas.length).toBe(70);
      expect(result.errores).toHaveLength(0);
      expect(result.conceptosIgnorados).toHaveLength(0);
    });

    it('should correctly parse IVA terminacion 0 as day 18, mesSiguiente true', () => {
      const html = loadFixture('arca-vencimientos-iva-2026-05.html');
      const result = parseArcaVencimientosHtml(html, 5, 2026, '2026-01-01');

      const ivaT0 = result.reglas.find(
        (r) => r.tipoObligacion === TIPO_OBLIGACION.IVA && r.terminacionCuit === '0',
      );
      expect(ivaT0).toBeDefined();
      expect(ivaT0!.diaVencimiento).toBe(18);
      expect(ivaT0!.mesSiguiente).toBe(true); // June date for May period
      expect(ivaT0!.jurisdiccion).toBe(JURISDICCION.ARCA);
      expect(ivaT0!.regimen).toBe('GENERAL');
      expect(ivaT0!.vigenciaDesde).toBe('2026-01-01');
    });

    it('should parse SICOSS with correct dates', () => {
      const html = loadFixture('arca-vencimientos-iva-2026-05.html');
      const result = parseArcaVencimientosHtml(html, 5, 2026, '2026-01-01');

      const sicossT0 = result.reglas.find(
        (r) => r.tipoObligacion === TIPO_OBLIGACION.SICOSS && r.terminacionCuit === '0',
      );
      expect(sicossT0).toBeDefined();
      expect(sicossT0!.diaVencimiento).toBe(9);
      expect(sicossT0!.mesSiguiente).toBe(true); // June
    });

    it('should parse Monotributo as same day for all terminaciones', () => {
      const html = loadFixture('arca-vencimientos-iva-2026-05.html');
      const result = parseArcaVencimientosHtml(html, 5, 2026, '2026-01-01');

      const monotributo = result.reglas.filter(
        (r) => r.tipoObligacion === TIPO_OBLIGACION.MONOTRIBUTO,
      );
      expect(monotributo).toHaveLength(10);
      for (const r of monotributo) {
        expect(r.diaVencimiento).toBe(20);
        expect(r.regimen).toBe('MONOTRIBUTO');
      }
    });

    it('should parse Ganancias Sociedades from second table', () => {
      const html = loadFixture('arca-vencimientos-iva-2026-05.html');
      const result = parseArcaVencimientosHtml(html, 5, 2026, '2026-01-01');

      const gananciasT0 = result.reglas.find(
        (r) => r.tipoObligacion === TIPO_OBLIGACION.DDJJ_GANANCIAS && r.terminacionCuit === '0',
      );
      expect(gananciasT0).toBeDefined();
      expect(gananciasT0!.diaVencimiento).toBe(12);
      expect(gananciasT0!.mesSiguiente).toBe(false); // May date for May period
      expect(gananciasT0!.regimen).toBe('SOCIEDADES');
    });

    it('should detect mesSiguiente=false when date is in same month as period', () => {
      const html = loadFixture('arca-vencimientos-iva-2026-05.html');
      const result = parseArcaVencimientosHtml(html, 5, 2026, '2026-01-01');

      // Ganancias Sociedades dates are in May (same as period)
      const ganancias = result.reglas.filter(
        (r) => r.tipoObligacion === TIPO_OBLIGACION.DDJJ_GANANCIAS,
      );
      for (const r of ganancias) {
        expect(r.mesSiguiente).toBe(false);
      }
    });

    it('should return empty reglas for empty page', () => {
      const html = loadFixture('arca-vencimientos-empty.html');
      const result = parseArcaVencimientosHtml(html, 5, 2026, '2026-01-01');

      expect(result.reglas).toHaveLength(0);
      expect(result.errores).toHaveLength(0);
      expect(result.conceptosIgnorados).toHaveLength(0);
    });

    it('should return empty reglas for malformed page (no tables)', () => {
      const html = loadFixture('arca-vencimientos-malformed.html');
      const result = parseArcaVencimientosHtml(html, 5, 2026, '2026-01-01');

      expect(result.reglas).toHaveLength(0);
    });

    it('should set all reglas with jurisdiccion ARCA', () => {
      const html = loadFixture('arca-vencimientos-iva-2026-05.html');
      const result = parseArcaVencimientosHtml(html, 5, 2026, '2026-01-01');

      for (const regla of result.reglas) {
        expect(regla.jurisdiccion).toBe(JURISDICCION.ARCA);
      }
    });

    it('should handle December periodo with January dates as mesSiguiente', () => {
      // Build inline HTML for a December scenario
      const html = `
        <table class="tabla-vencimientos">
          <tbody>
            <tr>
              <td class="concepto">IVA - DJ Mensual (F.2002)</td>
              <td class="fecha">18/01/2027</td>
              <td class="fecha">18/01/2027</td>
              <td class="fecha">19/01/2027</td>
              <td class="fecha">19/01/2027</td>
              <td class="fecha">20/01/2027</td>
              <td class="fecha">20/01/2027</td>
              <td class="fecha">21/01/2027</td>
              <td class="fecha">21/01/2027</td>
              <td class="fecha">22/01/2027</td>
              <td class="fecha">22/01/2027</td>
            </tr>
          </tbody>
        </table>
      `;
      const result = parseArcaVencimientosHtml(html, 12, 2026, '2026-01-01');

      expect(result.reglas).toHaveLength(10);
      for (const r of result.reglas) {
        expect(r.mesSiguiente).toBe(true);
      }
    });

    it('should report error for rows with insufficient cells', () => {
      const html = `
        <table class="tabla-vencimientos">
          <tbody>
            <tr>
              <td class="concepto">IVA - DJ Mensual</td>
              <td class="fecha">18/06/2026</td>
            </tr>
          </tbody>
        </table>
      `;
      const result = parseArcaVencimientosHtml(html, 5, 2026, '2026-01-01');

      expect(result.reglas).toHaveLength(0);
      expect(result.errores.length).toBeGreaterThan(0);
      expect(result.errores[0]).toContain('2 celdas');
    });
  });
});
