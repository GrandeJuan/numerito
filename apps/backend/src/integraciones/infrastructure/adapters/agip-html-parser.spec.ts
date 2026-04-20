import * as fs from 'fs';
import * as path from 'path';
import {
  parseAgipVencimientosHtml,
  resolverConceptoAgip,
  parseFechaAgip,
} from './agip-html-parser';
import { TIPO_OBLIGACION, JURISDICCION } from '@numerito/shared';

function loadFixture(name: string): string {
  return fs.readFileSync(
    path.join(__dirname, '__fixtures__', name),
    'utf-8',
  );
}

describe('AgipHtmlParser', () => {
  describe('parseFechaAgip', () => {
    it('should parse a valid DD/MM/YYYY date', () => {
      expect(parseFechaAgip('14/06/2026')).toEqual({ day: 14, month: 6, year: 2026 });
    });

    it('should return null for invalid format', () => {
      expect(parseFechaAgip('2026-06-14')).toBeNull();
      expect(parseFechaAgip('')).toBeNull();
    });

    it('should return null for out-of-range values', () => {
      expect(parseFechaAgip('32/06/2026')).toBeNull();
      expect(parseFechaAgip('0/06/2026')).toBeNull();
    });
  });

  describe('resolverConceptoAgip', () => {
    it('should map DDJJ Mensual IIBB Categoría Locales', () => {
      const result = resolverConceptoAgip('DDJJ Mensual IIBB - Categoría Locales');
      expect(result).toEqual({ tipo: TIPO_OBLIGACION.IIBB_AGIP, regimen: 'CATEGORIA_LOCALES' });
    });

    it('should map Anticipo Mensual IIBB Categoría Locales', () => {
      const result = resolverConceptoAgip('Anticipo Mensual IIBB - Categoría Locales');
      expect(result).toEqual({ tipo: TIPO_OBLIGACION.IIBB_AGIP, regimen: 'CATEGORIA_LOCALES_ANTICIPO' });
    });

    it('should map DDJJ IIBB Convenio Multilateral (CM05)', () => {
      const result = resolverConceptoAgip('DDJJ Mensual IIBB - Convenio Multilateral (CM05)');
      expect(result).toEqual({ tipo: TIPO_OBLIGACION.IIBB_CONVENIO_MULTILATERAL, regimen: 'CONVENIO_MULTILATERAL_CABA' });
    });

    it('should map Retenciones IIBB CABA', () => {
      const result = resolverConceptoAgip('Retenciones IIBB CABA - Régimen General');
      expect(result).toEqual({ tipo: TIPO_OBLIGACION.RETENCION_IIBB, regimen: 'CABA' });
    });

    it('should map Percepciones IIBB CABA', () => {
      const result = resolverConceptoAgip('Percepciones IIBB CABA - Régimen General');
      expect(result).toEqual({ tipo: TIPO_OBLIGACION.PERCEPCION_IIBB, regimen: 'CABA' });
    });

    it('should return null for ABL (not an IIBB obligation)', () => {
      expect(resolverConceptoAgip('ABL - Cuota 5/6')).toBeNull();
    });

    it('should return null for unknown concepto', () => {
      expect(resolverConceptoAgip('Patentes - Cuota 3/6')).toBeNull();
    });
  });

  describe('parseAgipVencimientosHtml', () => {
    it('should parse the main fixture with IIBB obligations', () => {
      const html = loadFixture('agip-vencimientos-2026-05.html');
      const result = parseAgipVencimientosHtml(html, 5, 2026, '2026-01-01');

      // 5 IIBB concepts × 10 terminaciones = 50 reglas
      // ABL is ignored (1 concept × 10 = 10 ignored)
      expect(result.reglas.length).toBe(50);
      expect(result.errores).toHaveLength(0);
      expect(result.conceptosIgnorados).toHaveLength(1); // ABL
    });

    it('should correctly parse IIBB Locales terminacion 0', () => {
      const html = loadFixture('agip-vencimientos-2026-05.html');
      const result = parseAgipVencimientosHtml(html, 5, 2026, '2026-01-01');

      const iibbT0 = result.reglas.find(
        (r) => r.tipoObligacion === TIPO_OBLIGACION.IIBB_AGIP &&
          r.regimen === 'CATEGORIA_LOCALES' &&
          r.terminacionCuit === '0',
      );
      expect(iibbT0).toBeDefined();
      expect(iibbT0!.diaVencimiento).toBe(14);
      expect(iibbT0!.mesSiguiente).toBe(true); // June date for May period
      expect(iibbT0!.jurisdiccion).toBe(JURISDICCION.AGIP);
      expect(iibbT0!.vigenciaDesde).toBe('2026-01-01');
    });

    it('should correctly parse Convenio Multilateral CABA', () => {
      const html = loadFixture('agip-vencimientos-2026-05.html');
      const result = parseAgipVencimientosHtml(html, 5, 2026, '2026-01-01');

      const cmT0 = result.reglas.find(
        (r) => r.tipoObligacion === TIPO_OBLIGACION.IIBB_CONVENIO_MULTILATERAL &&
          r.regimen === 'CONVENIO_MULTILATERAL_CABA' &&
          r.terminacionCuit === '0',
      );
      expect(cmT0).toBeDefined();
      expect(cmT0!.diaVencimiento).toBe(16);
      expect(cmT0!.mesSiguiente).toBe(true);
    });

    it('should parse Retenciones and Percepciones IIBB CABA', () => {
      const html = loadFixture('agip-vencimientos-2026-05.html');
      const result = parseAgipVencimientosHtml(html, 5, 2026, '2026-01-01');

      const retenciones = result.reglas.filter(
        (r) => r.tipoObligacion === TIPO_OBLIGACION.RETENCION_IIBB && r.regimen === 'CABA',
      );
      expect(retenciones).toHaveLength(10);

      const percepciones = result.reglas.filter(
        (r) => r.tipoObligacion === TIPO_OBLIGACION.PERCEPCION_IIBB && r.regimen === 'CABA',
      );
      expect(percepciones).toHaveLength(10);
    });

    it('should set all reglas with jurisdiccion AGIP', () => {
      const html = loadFixture('agip-vencimientos-2026-05.html');
      const result = parseAgipVencimientosHtml(html, 5, 2026, '2026-01-01');

      for (const regla of result.reglas) {
        expect(regla.jurisdiccion).toBe(JURISDICCION.AGIP);
      }
    });

    it('should return empty reglas for empty page', () => {
      const html = loadFixture('agip-vencimientos-empty.html');
      const result = parseAgipVencimientosHtml(html, 5, 2026, '2026-01-01');

      expect(result.reglas).toHaveLength(0);
      expect(result.errores).toHaveLength(0);
      expect(result.conceptosIgnorados).toHaveLength(0);
    });

    it('should return empty reglas for malformed page', () => {
      const html = loadFixture('agip-vencimientos-malformed.html');
      const result = parseAgipVencimientosHtml(html, 5, 2026, '2026-01-01');

      expect(result.reglas).toHaveLength(0);
    });

    it('should handle December period with January dates as mesSiguiente', () => {
      const html = `
        <table class="grilla-vtos">
          <tbody>
            <tr>
              <td>DDJJ Mensual IIBB - Categoría Locales</td>
              <td>14/01/2027</td><td>14/01/2027</td><td>15/01/2027</td>
              <td>15/01/2027</td><td>16/01/2027</td><td>16/01/2027</td>
              <td>17/01/2027</td><td>17/01/2027</td><td>18/01/2027</td>
              <td>18/01/2027</td>
            </tr>
          </tbody>
        </table>
      `;
      const result = parseAgipVencimientosHtml(html, 12, 2026, '2026-01-01');

      expect(result.reglas).toHaveLength(10);
      for (const r of result.reglas) {
        expect(r.mesSiguiente).toBe(true);
      }
    });

    it('should report error for rows with insufficient cells', () => {
      const html = `
        <table class="grilla-vtos">
          <tbody>
            <tr>
              <td>DDJJ Mensual IIBB - Categoría Locales</td>
              <td>14/06/2026</td>
            </tr>
          </tbody>
        </table>
      `;
      const result = parseAgipVencimientosHtml(html, 5, 2026, '2026-01-01');

      expect(result.reglas).toHaveLength(0);
      expect(result.errores.length).toBeGreaterThan(0);
      expect(result.errores[0]).toContain('2 celdas');
    });

    it('should ignore ABL and track it in conceptosIgnorados', () => {
      const html = loadFixture('agip-vencimientos-2026-05.html');
      const result = parseAgipVencimientosHtml(html, 5, 2026, '2026-01-01');

      expect(result.conceptosIgnorados).toContain('ABL - Cuota 5/6');
    });
  });
});
