import { Vencimiento } from './vencimiento.entity';
import { TIPO_OBLIGACION, ESTADO_VENCIMIENTO } from '@numerito/shared';
import { VencimientoCumplido } from '../events/vencimiento-cumplido.event';
import { VencimientoVencido } from '../events/vencimiento-vencido.event';

describe('Vencimiento Entity', () => {
  const createVencimiento = () => {
    return Vencimiento.create({
      clienteId: 'cliente-1',
      estudioId: 'estudio-1',
      tipoObligacion: TIPO_OBLIGACION.IVA,
      periodo: '2030-03',
      fechaVencimiento: new Date('2030-04-15'),
      descripcion: 'DDJJ IVA Marzo 2030',
    });
  };

  it('should create with PENDIENTE state', () => {
    const v = createVencimiento();
    expect(v.id).toBeDefined();
    expect(v.estado).toBe(ESTADO_VENCIMIENTO.PENDIENTE);
    expect(v.tipoObligacion).toBe(TIPO_OBLIGACION.IVA);
    expect(v.periodo).toBe('2030-03');
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
      estudioId: 'e1',
      tipoObligacion: TIPO_OBLIGACION.MONOTRIBUTO,
      periodo: '2026-04',
      fechaVencimiento: tomorrow,
      descripcion: 'Monotributo',
    });
    expect(v.isProximoAVencer(3)).toBe(true);
    expect(v.isProximoAVencer(0)).toBe(false);
  });

  it('should not be proximo a vencer if not PENDIENTE', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const v = Vencimiento.create({
      clienteId: 'c1',
      estudioId: 'e1',
      tipoObligacion: TIPO_OBLIGACION.IVA,
      periodo: '2026-04',
      fechaVencimiento: tomorrow,
      descripcion: 'IVA',
    });
    v.presentar();
    expect(v.isProximoAVencer(3)).toBe(false);
  });

  it('should reject past fechaVencimiento on create', () => {
    const pastDate = new Date('2020-01-01');
    expect(() =>
      Vencimiento.create({
        clienteId: 'c1',
        estudioId: 'e1',
        tipoObligacion: TIPO_OBLIGACION.IVA,
        periodo: '2020-01',
        fechaVencimiento: pastDate,
        descripcion: 'IVA viejo',
      }),
    ).toThrow('La fecha de vencimiento no puede ser pasada');
  });

  it('should expose all getters', () => {
    const v = createVencimiento();
    expect(v.clienteId).toBe('cliente-1');
    expect(v.estudioId).toBe('estudio-1');
    expect(v.tipoObligacion).toBe(TIPO_OBLIGACION.IVA);
    expect(v.periodo).toBe('2030-03');
    expect(v.fechaVencimiento).toEqual(new Date('2030-04-15'));
    expect(v.descripcion).toBe('DDJJ IVA Marzo 2030');
    expect(v.estado).toBe(ESTADO_VENCIMIENTO.PENDIENTE);
  });

  describe('reconstitute', () => {
    it('should reconstitute with a past fechaVencimiento without throwing', () => {
      const pastDate = new Date('2020-01-01');
      const v = Vencimiento.reconstitute(
        {
          clienteId: 'c1',
          estudioId: 'e1',
          tipoObligacion: TIPO_OBLIGACION.IVA,
          periodo: '2020-01',
          fechaVencimiento: pastDate,
          descripcion: 'IVA viejo',
          estado: ESTADO_VENCIMIENTO.VENCIDO,
        },
        'existing-id',
      );

      expect(v.id).toBe('existing-id');
      expect(v.estado).toBe(ESTADO_VENCIMIENTO.VENCIDO);
      expect(v.fechaVencimiento).toEqual(pastDate);
    });

    it('should preserve all fields on reconstitute', () => {
      const v = Vencimiento.reconstitute(
        {
          clienteId: 'cliente-1',
          estudioId: 'estudio-1',
          tipoObligacion: TIPO_OBLIGACION.MONOTRIBUTO,
          periodo: '2025-06',
          fechaVencimiento: new Date('2025-06-20'),
          descripcion: 'Monotributo Junio',
          estado: ESTADO_VENCIMIENTO.PRESENTADO,
        },
        'reconstituted-id',
      );

      expect(v.id).toBe('reconstituted-id');
      expect(v.clienteId).toBe('cliente-1');
      expect(v.estudioId).toBe('estudio-1');
      expect(v.tipoObligacion).toBe(TIPO_OBLIGACION.MONOTRIBUTO);
      expect(v.periodo).toBe('2025-06');
      expect(v.descripcion).toBe('Monotributo Junio');
      expect(v.estado).toBe(ESTADO_VENCIMIENTO.PRESENTADO);
    });

    it('should allow domain operations on reconstituted entities', () => {
      const v = Vencimiento.reconstitute(
        {
          clienteId: 'c1',
          estudioId: 'e1',
          tipoObligacion: TIPO_OBLIGACION.IVA,
          periodo: '2020-01',
          fechaVencimiento: new Date('2020-01-15'),
          descripcion: 'IVA',
          estado: ESTADO_VENCIMIENTO.PENDIENTE,
        },
        'some-id',
      );

      v.marcarVencido();
      expect(v.estado).toBe(ESTADO_VENCIMIENTO.VENCIDO);
      expect(v.getDomainEvents()).toHaveLength(1);
      expect(v.getDomainEvents()[0]).toBeInstanceOf(VencimientoVencido);
    });
  });

  describe('domain events', () => {
    it('should emit VencimientoCumplido on presentar', () => {
      const v = createVencimiento();
      v.presentar();
      const events = v.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(VencimientoCumplido);
      const event = events[0] as VencimientoCumplido;
      expect(event.vencimientoId).toBe(v.id);
      expect(event.clienteId).toBe('cliente-1');
      expect(event.tipoObligacion).toBe(TIPO_OBLIGACION.IVA);
      expect(event.periodo).toBe('2030-03');
      expect(event.eventName).toBe('obligaciones.vencimiento-cumplido');
    });

    it('should emit VencimientoVencido on marcarVencido', () => {
      const v = createVencimiento();
      v.marcarVencido();
      const events = v.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(VencimientoVencido);
      const event = events[0] as VencimientoVencido;
      expect(event.vencimientoId).toBe(v.id);
      expect(event.clienteId).toBe('cliente-1');
      expect(event.eventName).toBe('obligaciones.vencimiento-vencido');
    });
  });
});
