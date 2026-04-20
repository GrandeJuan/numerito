import * as fs from 'fs';
import * as path from 'path';
import {
  parseBcraFeriadosHtml,
  parseFechaBcra,
  clasificarTipoFeriado,
} from './bcra-feriados-parser';
import { TIPO_FERIADO } from '@numerito/shared';

function loadFixture(name: string): string {
  return fs.readFileSync(
    path.join(__dirname, '__fixtures__', name),
    'utf-8',
  );
}

describe('BcraFeriadosParser', () => {
  describe('parseFechaBcra', () => {
    it('should parse DD/MM/YYYY to ISO date string', () => {
      expect(parseFechaBcra('01/01/2026')).toBe('2026-01-01');
      expect(parseFechaBcra('24/03/2026')).toBe('2026-03-24');
      expect(parseFechaBcra('25/12/2026')).toBe('2026-12-25');
    });

    it('should parse single-digit day/month', () => {
      expect(parseFechaBcra('1/1/2026')).toBe('2026-01-01');
    });

    it('should return null for invalid format', () => {
      expect(parseFechaBcra('2026-01-01')).toBeNull();
      expect(parseFechaBcra('abc')).toBeNull();
      expect(parseFechaBcra('')).toBeNull();
    });

    it('should return null for out-of-range values', () => {
      expect(parseFechaBcra('32/01/2026')).toBeNull();
      expect(parseFechaBcra('01/13/2026')).toBeNull();
    });
  });

  describe('clasificarTipoFeriado', () => {
    it('should classify Feriado Nacional', () => {
      expect(clasificarTipoFeriado('Feriado Nacional')).toBe(TIPO_FERIADO.NACIONAL);
    });

    it('should classify Feriado Nacional (trasladado)', () => {
      expect(clasificarTipoFeriado('Feriado Nacional (trasladado)')).toBe(TIPO_FERIADO.NACIONAL);
    });

    it('should classify Feriado Bancario', () => {
      expect(clasificarTipoFeriado('Feriado Bancario')).toBe(TIPO_FERIADO.BANCARIO);
    });

    it('should return null for unknown type', () => {
      expect(clasificarTipoFeriado('Día no laborable')).toBeNull();
      expect(clasificarTipoFeriado('')).toBeNull();
    });
  });

  describe('parseBcraFeriadosHtml', () => {
    it('should parse the main fixture with all 2026 feriados', () => {
      const html = loadFixture('bcra-feriados-2026.html');
      const result = parseBcraFeriadosHtml(html);

      // 19 rows: 16 nacionales + 3 bancarios
      expect(result.feriados.length).toBe(19);
      expect(result.errores).toHaveLength(0);
    });

    it('should correctly parse Año Nuevo as NACIONAL', () => {
      const html = loadFixture('bcra-feriados-2026.html');
      const result = parseBcraFeriadosHtml(html);

      const anioNuevo = result.feriados.find((f) => f.descripcion === 'Año Nuevo');
      expect(anioNuevo).toBeDefined();
      expect(anioNuevo!.fecha).toBe('2026-01-01');
      expect(anioNuevo!.tipo).toBe(TIPO_FERIADO.NACIONAL);
      expect(anioNuevo!.jurisdiccionAfectada).toBeNull();
    });

    it('should correctly parse Jueves Santo as BANCARIO', () => {
      const html = loadFixture('bcra-feriados-2026.html');
      const result = parseBcraFeriadosHtml(html);

      const juevesSanto = result.feriados.find((f) => f.descripcion === 'Jueves Santo');
      expect(juevesSanto).toBeDefined();
      expect(juevesSanto!.fecha).toBe('2026-04-02');
      expect(juevesSanto!.tipo).toBe(TIPO_FERIADO.BANCARIO);
    });

    it('should correctly parse Nochebuena as BANCARIO', () => {
      const html = loadFixture('bcra-feriados-2026.html');
      const result = parseBcraFeriadosHtml(html);

      const nochebuena = result.feriados.find((f) => f.descripcion === 'Nochebuena');
      expect(nochebuena).toBeDefined();
      expect(nochebuena!.fecha).toBe('2026-12-24');
      expect(nochebuena!.tipo).toBe(TIPO_FERIADO.BANCARIO);
    });

    it('should parse trasladado dates as NACIONAL', () => {
      const html = loadFixture('bcra-feriados-2026.html');
      const result = parseBcraFeriadosHtml(html);

      const guemes = result.feriados.find(
        (f) => f.descripcion.includes('Güemes'),
      );
      expect(guemes).toBeDefined();
      expect(guemes!.fecha).toBe('2026-06-15');
      expect(guemes!.tipo).toBe(TIPO_FERIADO.NACIONAL);
    });

    it('should count NACIONAL and BANCARIO feriados correctly', () => {
      const html = loadFixture('bcra-feriados-2026.html');
      const result = parseBcraFeriadosHtml(html);

      const nacionales = result.feriados.filter((f) => f.tipo === TIPO_FERIADO.NACIONAL);
      const bancarios = result.feriados.filter((f) => f.tipo === TIPO_FERIADO.BANCARIO);

      expect(nacionales.length).toBe(16);
      expect(bancarios.length).toBe(3);
    });

    it('should return empty feriados for empty page', () => {
      const html = loadFixture('bcra-feriados-empty.html');
      const result = parseBcraFeriadosHtml(html);

      expect(result.feriados).toHaveLength(0);
      expect(result.errores).toHaveLength(0);
    });

    it('should return empty feriados for malformed page (no table)', () => {
      const html = loadFixture('bcra-feriados-malformed.html');
      const result = parseBcraFeriadosHtml(html);

      expect(result.feriados).toHaveLength(0);
    });

    it('should handle 3-column table (no Día column)', () => {
      const html = `
        <table>
          <tbody>
            <tr>
              <td>01/01/2026</td>
              <td>Año Nuevo</td>
              <td>Feriado Nacional</td>
            </tr>
            <tr>
              <td>24/12/2026</td>
              <td>Nochebuena</td>
              <td>Feriado Bancario</td>
            </tr>
          </tbody>
        </table>
      `;
      const result = parseBcraFeriadosHtml(html);

      expect(result.feriados).toHaveLength(2);
      expect(result.feriados[0].fecha).toBe('2026-01-01');
      expect(result.feriados[0].descripcion).toBe('Año Nuevo');
      expect(result.feriados[0].tipo).toBe(TIPO_FERIADO.NACIONAL);
      expect(result.feriados[1].fecha).toBe('2026-12-24');
      expect(result.feriados[1].tipo).toBe(TIPO_FERIADO.BANCARIO);
    });

    it('should report error for rows with insufficient cells', () => {
      const html = `
        <table>
          <tbody>
            <tr>
              <td>01/01/2026</td>
              <td>Año Nuevo</td>
            </tr>
          </tbody>
        </table>
      `;
      const result = parseBcraFeriadosHtml(html);

      expect(result.feriados).toHaveLength(0);
      expect(result.errores.length).toBeGreaterThan(0);
      expect(result.errores[0]).toContain('2 celdas');
    });

    it('should report error for unrecognized tipo', () => {
      const html = `
        <table>
          <tbody>
            <tr>
              <td>01/01/2026</td>
              <td>Algo Especial</td>
              <td>Día no laborable</td>
            </tr>
          </tbody>
        </table>
      `;
      const result = parseBcraFeriadosHtml(html);

      expect(result.feriados).toHaveLength(0);
      expect(result.errores.length).toBeGreaterThan(0);
      expect(result.errores[0]).toContain('no reconocido');
    });
  });
});
