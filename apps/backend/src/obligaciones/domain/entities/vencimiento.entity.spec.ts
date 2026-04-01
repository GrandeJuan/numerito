import { Vencimiento, ESTADO_VENCIMIENTO } from './vencimiento.entity';
import { TIPO_OBLIGACION } from '@numerito/shared';

describe('Vencimiento Entity', () => {
  const createVencimiento = () => {
    return Vencimiento.create({
      clienteId: 'cliente-1',
      tenantId: 'tenant-1',
      tipoObligacion: TIPO_OBLIGACION.IVA,
      periodo: '2026-03',
      fechaVencimiento: new Date('2026-04-15'),
      descripcion: 'DDJJ IVA Marzo 2026',
    });
  };

  it('should create with PENDIENTE state', () => {
    const v = createVencimiento();
    expect(v.id).toBeDefined();
    expect(v.estado).toBe(ESTADO_VENCIMIENTO.PENDIENTE);
    expect(v.tipoObligacion).toBe(TIPO_OBLIGACION.IVA);
    expect(v.periodo).toBe('2026-03');
  });

  it('should transition to PRESENTADO', () => {
    const v = createVencimiento();
    v.presentar();
    expect(v.estado).toBe(ESTADO_VENCIMIENTO.PRESENTADO);
  });

  it('should transition to VENCIDO', () => {
    const v = createVencimiento();
    v.marcarVencido();
    expect(v.estado).toBe(ESTADO_VENCIMIENTO.VENCIDO);
  });

  it('should not present if already vencido', () => {
    const v = createVencimiento();
    v.marcarVencido();
    expect(() => v.presentar()).toThrow();
  });

  it('should detect if is near due date', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const v = Vencimiento.create({
      clienteId: 'c1',
      tenantId: 't1',
      tipoObligacion: TIPO_OBLIGACION.MONOTRIBUTO,
      periodo: '2026-04',
      fechaVencimiento: tomorrow,
      descripcion: 'Monotributo',
    });
    expect(v.isProximoAVencer(3)).toBe(true);
    expect(v.isProximoAVencer(0)).toBe(false);
  });
});
