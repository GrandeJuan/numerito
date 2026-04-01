import { ReglaVencimientoService } from './regla-vencimiento.service';
import { TIPO_OBLIGACION } from '@numerito/shared';

describe('ReglaVencimientoService', () => {
  const service = new ReglaVencimientoService();

  it('should calculate IVA due date based on CUIT ending', () => {
    // CUIT ending in 6 → day 18 of next month
    const fecha = service.calcularFechaVencimiento(TIPO_OBLIGACION.IVA, '20123456786', '2026-03');
    expect(fecha.getDate()).toBe(18);
    expect(fecha.getMonth()).toBe(3); // April (0-indexed)
    expect(fecha.getFullYear()).toBe(2026);
  });

  it('should calculate Monotributo due date (always 20th)', () => {
    const fecha = service.calcularFechaVencimiento(TIPO_OBLIGACION.MONOTRIBUTO, '20123456786', '2026-03');
    expect(fecha.getDate()).toBe(20);
    expect(fecha.getMonth()).toBe(3);
  });

  it('should calculate IIBB due date based on CUIT ending', () => {
    const fecha = service.calcularFechaVencimiento(TIPO_OBLIGACION.IIBB_ARBA, '20123456786', '2026-03');
    expect(fecha).toBeInstanceOf(Date);
  });
});
