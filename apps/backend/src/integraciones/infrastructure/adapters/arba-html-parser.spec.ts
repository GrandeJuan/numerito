import * as fs from 'fs';
import * as path from 'path';
import {
  parseArbaVencimientosHtml,
  resolverConceptoArba,
  parseFechaArba,
} from './arba-html-parser';
import { TIPO_OBLIGACION, JURISDICCION } from '@numerito/shared';

function loadFixture(name: string): string {
  return fs.readFileSync(
    path.join(__dirname, '__fixtures__', name),
    'utf-8',
  );
}

describe('ArbaHtmlParser', () => {
  describe('parseFechaArba', () => {
    it('should parse a valid DD/MM/YYYY date', () => {
      expect(parseFechaArba('15/06/2026')).toEqual({ day: 15, month: 6, year: 2026 });
    });

    it('should parse single-digit day/month', () => {
      expect(parseFechaArba('5/1/2026')).toEqual({ day: 5, month: 1, year: 2026 });
    });

    it('should return null for invalid format', () => {
      expect(parseFechaArba('2026-06-15')).toBeNull();
      expect(parseFechaArba('abc')).toBeNull();
      expect(parseFechaArba('')).toBeNull();
    });

    it('should return null for out-of-range values', () => {
      expect(parseFechaArba('32/06/2026')).toBeNull();
      expect(parseFechaArba('15/13/2026')).toBeNull();
      expect(parseFechaArba('0/06/2026')).toBeNull();
    });
  });

  describe('resolverConceptoArba', () => {
    it('should map DDJJ Mensual IIBB Contribuyente Directo', () => {
      const result = resolverConceptoArba('DDJJ Mensual IIBB - Contribuyente Directo');
      expect(result).toEqual({ tipo: TIPO_OBLIGACION.IIBB_ARBA, regimen: 'CONTRIBUYENTE_DIRECTO' });
    });

    it('should map Anticipo Mensual IIBB Contribuyente Directo', () => {
      const result = resolverConceptoArba('Anticipo Mensual IIBB - Contribuyente Directo');
      expect(result).toEqual({ tipo: TIPO_OBLIGACION.IIBB_ARBA, regimen: 'CONTRIBUYENTE_DIRECTO_ANTICIPO' });
    });

    it('should map DDJJ Mensual IIBB Convenio Multilateral', () => {
      const result = resolverConceptoArba('DDJJ Mensual IIBB - Convenio Multilateral');
      expect(result).toEqual({ tipo: TIPO_OBLIGACION.IIBB_CONVENIO_MULTILATERAL, regimen: 'CONVENIO_MULTILATERAL' });
    });

    it('should map Retenciones IIBB', () => {
      const result = resolverConceptoArba('Retenciones IIBB - Régimen General');
      expect(result).toEqual({ tipo: TIPO_OBLIGACION.RETENCION_IIBB, regimen: 'GENERAL' });
    });

    it('should map Percepciones IIBB', () => {
      const result = resolverConceptoArba('Percepciones IIBB - Régimen General');
      expect(result).toEqual({ tipo: TIPO_OBLIGACION.PERCEPCION_IIBB, regimen: 'GENERAL' });
    });

    it('should return null for Inmobiliario (not an IIBB obligation)', () => {
      expect(resolverConceptoArba('Inmobiliario Urbano - Cuota 3/5')).toBeNull();
    });

    it('should return null for unknown concepto', () => {
      expect(resolverConceptoArba('Tasa Municipal de Seguridad')).toBeNull();
    });
  });

  describe('parseArbaVencimientosHtml', () => {
    it('should parse the main fixture with IIBB obligations', () => {
      const html = loadFixture('arba-vencimientos-2026-05.html');
      const result = parseArbaVencimientosHtml(html, 5, 2026, '2026-01-01');

      // 4 IIBB concepts × 10 terminaciones = 40 reglas
      // Inmobiliario is ignored (1 concept × 10 = 10 ignored)
      expect(result.reglas.length).toBe(40);
      expect(result.errores).toHaveLength(0);
      expect(result.conceptosIgnorados).toHaveLength(1); // Inmobiliario
    });

    it('should correctly parse IIBB Directo terminacion 0', () => {
      const html = loadFixture('arba-vencimientos-2026-05.html');
      const result = parseArbaVencimientosHtml(html, 5, 2026, '2026-01-01');

      const iibbT0 = result.reglas.find(
        (r) => r.tipoObligacion === TIPO_OBLIGACION.IIBB_ARBA &&
          r.regimen === 'CONTRIBUYENTE_DIRECTO' &&
          r.terminacionCuit === '0',
      );
      expect(iibbT0).toBeDefined();
      expect(iibbT0!.diaVencimiento).toBe(15);
      expect(iibbT0!.mesSiguiente).toBe(true); // June date for May period
      expect(iibbT0!.jurisdiccion).toBe(JURISDICCION.ARBA);
      expect(iibbT0!.vigenciaDesde).toBe('2026-01-01');
    });

    it('should correctly parse Convenio Multilateral', () => {
      const html = loadFixture('arba-vencimientos-2026-05.html');
      const result = parseArbaVencimientosHtml(html, 5, 2026, '2026-01-01');

      const cmT0 = result.reglas.find(
        (r) => r.tipoObligacion === TIPO_OBLIGACION.IIBB_CONVENIO_MULTILATERAL &&
          r.terminacionCuit === '0',
      );
      expect(cmT0).toBeDefined();
      expect(cmT0!.diaVencimiento).toBe(17);
      expect(cmT0!.mesSiguiente).toBe(true);
    });

    it('should parse Retenciones and Percepciones IIBB', () => {
      const html = loadFixture('arba-vencimientos-2026-05.html');
      const result = parseArbaVencimientosHtml(html, 5, 2026, '2026-01-01');

      const retenciones = result.reglas.filter(
        (r) => r.tipoObligacion === TIPO_OBLIGACION.RETENCION_IIBB,
      );
      expect(retenciones).toHaveLength(10);

      const percepciones = result.reglas.filter(
        (r) => r.tipoObligacion === TIPO_OBLIGACION.PERCEPCION_IIBB,
      );
      expect(percepciones).toHaveLength(10);
    });

    it('should set all reglas with jurisdiccion ARBA', () => {
      const html = loadFixture('arba-vencimientos-2026-05.html');
      const result = parseArbaVencimientosHtml(html, 5, 2026, '2026-01-01');

      for (const regla of result.reglas) {
        expect(regla.jurisdiccion).toBe(JURISDICCION.ARBA);
      }
    });

    it('should return empty reglas for empty page', () => {
      const html = loadFixture('arba-vencimientos-empty.html');
      const result = parseArbaVencimientosHtml(html, 5, 2026, '2026-01-01');

      expect(result.reglas).toHaveLength(0);
      expect(result.errores).toHaveLength(0);
      expect(result.conceptosIgnorados).toHaveLength(0);
    });

    it('should return empty reglas for malformed page (no tables)', () => {
      const html = loadFixture('arba-vencimientos-malformed.html');
      const result = parseArbaVencimientosHtml(html, 5, 2026, '2026-01-01');

      expect(result.reglas).toHaveLength(0);
    });

    it('should handle December period with January dates as mesSiguiente', () => {
      const html = `
        <table class="tabla-calendario">
          <tbody>
            <tr>
              <td class="concepto">DDJJ Mensual IIBB - Contribuyente Directo</td>
              <td>15/01/2027</td><td>15/01/2027</td><td>16/01/2027</td>
              <td>16/01/2027</td><td>17/01/2027</td><td>17/01/2027</td>
              <td>18/01/2027</td><td>18/01/2027</td><td>19/01/2027</td>
              <td>19/01/2027</td>
            </tr>
          </tbody>
        </table>
      `;
      const result = parseArbaVencimientosHtml(html, 12, 2026, '2026-01-01');

      expect(result.reglas).toHaveLength(10);
      for (const r of result.reglas) {
        expect(r.mesSiguiente).toBe(true);
      }
    });

    it('should report error for rows with insufficient cells', () => {
      const html = `
        <table class="tabla-calendario">
          <tbody>
            <tr>
              <td class="concepto">DDJJ Mensual IIBB - Contribuyente Directo</td>
              <td>15/06/2026</td>
            </tr>
          </tbody>
        </table>
      `;
      const result = parseArbaVencimientosHtml(html, 5, 2026, '2026-01-01');

      expect(result.reglas).toHaveLength(0);
      expect(result.errores.length).toBeGreaterThan(0);
      expect(result.errores[0]).toContain('2 celdas');
    });

    it('should ignore Inmobiliario and track it in conceptosIgnorados', () => {
      const html = loadFixture('arba-vencimientos-2026-05.html');
      const result = parseArbaVencimientosHtml(html, 5, 2026, '2026-01-01');

      expect(result.conceptosIgnorados).toContain('Inmobiliario Urbano - Cuota 3/5');
    });
  });
});
