import { AjusteDiaHabilService } from './ajuste-dia-habil.service';
import { DiaFeriado, TIPO_FERIADO } from '../entities/dia-feriado.entity';

/**
 * Tests use ajustarConFeriados (pure computation) to avoid async repo calls.
 * This is the domain logic under test — the repo integration is tested at
 * the infrastructure layer.
 */
describe('AjusteDiaHabilService', () => {
  // We pass null as repo since we use ajustarConFeriados directly
  const service = new AjusteDiaHabilService(null as any);

  function feriado(fecha: string, tipo: string, jurisdiccion?: string): DiaFeriado {
    return DiaFeriado.create({
      fecha: new Date(fecha),
      tipo: tipo as any,
      descripcion: `Feriado ${fecha}`,
      jurisdiccionAfectada: jurisdiccion ?? null,
    });
  }

  describe('día hábil — no adjustment needed', () => {
    it('returns the same date when it is a weekday with no feriados', () => {
      // 2026-05-04 is Monday
      const result = service.ajustarConFeriados(
        new Date('2026-05-04'),
        'ARCA',
        [],
      );
      expect(result.toISOString().slice(0, 10)).toBe('2026-05-04');
    });
  });

  describe('fin de semana', () => {
    it('moves Saturday to next Monday', () => {
      // 2026-05-02 is Saturday
      const result = service.ajustarConFeriados(
        new Date('2026-05-02'),
        'ARCA',
        [],
      );
      expect(result.toISOString().slice(0, 10)).toBe('2026-05-04'); // Monday
    });

    it('moves Sunday to next Monday', () => {
      // 2026-05-03 is Sunday
      const result = service.ajustarConFeriados(
        new Date('2026-05-03'),
        'ARCA',
        [],
      );
      expect(result.toISOString().slice(0, 10)).toBe('2026-05-04'); // Monday
    });
  });

  describe('feriado nacional', () => {
    it('moves to the next business day', () => {
      // 2026-05-01 is Friday, Día del Trabajador
      const feriados = [feriado('2026-05-01', TIPO_FERIADO.NACIONAL)];
      const result = service.ajustarConFeriados(
        new Date('2026-05-01'),
        'ARCA',
        feriados,
      );
      // Next day is Saturday 05-02, then Sunday 05-03, then Monday 05-04
      expect(result.toISOString().slice(0, 10)).toBe('2026-05-04');
    });

    it('national holiday affects all jurisdictions', () => {
      const feriados = [feriado('2026-05-25', TIPO_FERIADO.NACIONAL)];
      // 2026-05-25 is Monday
      const resultArca = service.ajustarConFeriados(new Date('2026-05-25'), 'ARCA', feriados);
      const resultArba = service.ajustarConFeriados(new Date('2026-05-25'), 'ARBA', feriados);
      expect(resultArca.toISOString().slice(0, 10)).toBe('2026-05-26');
      expect(resultArba.toISOString().slice(0, 10)).toBe('2026-05-26');
    });
  });

  describe('feriado bancario', () => {
    it('banking holiday affects all jurisdictions (shifts fiscal dates)', () => {
      // 2026-12-31 is Thursday
      const feriados = [feriado('2026-12-31', TIPO_FERIADO.BANCARIO)];
      const result = service.ajustarConFeriados(
        new Date('2026-12-31'),
        'ARCA',
        feriados,
      );
      // Next day 01-01 is... a new year. But we only have the banking holiday in our list.
      // Without a Jan 1 feriado, it advances to Jan 1 (Thursday → Friday 01-01 if no feriado)
      // Actually 2026-12-31 is Thursday, next is 2027-01-01 which is Friday (not in feriados)
      // Wait: 2026-12-31 is a Thursday. Next day is 2027-01-01 Friday.
      expect(result.toISOString().slice(0, 10)).toBe('2027-01-01');
    });
  });

  describe('feriado provincial', () => {
    it('provincial feriado affects only its jurisdiccion', () => {
      // 2026-06-15 is Monday
      const feriados = [feriado('2026-06-15', TIPO_FERIADO.PROVINCIAL, 'ARBA')];

      const resultArba = service.ajustarConFeriados(new Date('2026-06-15'), 'ARBA', feriados);
      expect(resultArba.toISOString().slice(0, 10)).toBe('2026-06-16');

      const resultArca = service.ajustarConFeriados(new Date('2026-06-15'), 'ARCA', feriados);
      expect(resultArca.toISOString().slice(0, 10)).toBe('2026-06-15'); // Not affected
    });
  });

  describe('feriado seguido de fin de semana', () => {
    it('holiday on Friday → skips Saturday and Sunday → lands on Monday', () => {
      // 2026-05-01 is Friday
      const feriados = [feriado('2026-05-01', TIPO_FERIADO.NACIONAL)];
      const result = service.ajustarConFeriados(new Date('2026-05-01'), 'ARCA', feriados);
      expect(result.toISOString().slice(0, 10)).toBe('2026-05-04'); // Monday
    });
  });

  describe('consecutive feriados', () => {
    it('skips multiple consecutive non-business days', () => {
      // 2026-05-25 is Monday (Revolución de Mayo)
      // 2026-05-26 is Tuesday (bridge day — feriado puente)
      const feriados = [
        feriado('2026-05-25', TIPO_FERIADO.NACIONAL),
        feriado('2026-05-26', TIPO_FERIADO.NACIONAL),
      ];
      const result = service.ajustarConFeriados(new Date('2026-05-25'), 'ARCA', feriados);
      expect(result.toISOString().slice(0, 10)).toBe('2026-05-27'); // Wednesday
    });

    it('handles feriado + weekend + feriado combo', () => {
      // Scenario: Thursday feriado, Friday feriado, Saturday, Sunday → Monday
      // 2026-07-09 is Thursday (Independencia), 2026-07-10 is Friday (bridge)
      const feriados = [
        feriado('2026-07-09', TIPO_FERIADO.NACIONAL),
        feriado('2026-07-10', TIPO_FERIADO.NACIONAL),
      ];
      const result = service.ajustarConFeriados(new Date('2026-07-09'), 'ARCA', feriados);
      expect(result.toISOString().slice(0, 10)).toBe('2026-07-13'); // Monday
    });
  });

  describe('already a business day with unrelated feriado', () => {
    it('does not adjust when feriado is for a different jurisdiction', () => {
      // 2026-06-15 is Monday, provincial feriado for AGIP only
      const feriados = [feriado('2026-06-15', TIPO_FERIADO.PROVINCIAL, 'AGIP')];
      const result = service.ajustarConFeriados(new Date('2026-06-15'), 'ARCA', feriados);
      expect(result.toISOString().slice(0, 10)).toBe('2026-06-15');
    });
  });
});
