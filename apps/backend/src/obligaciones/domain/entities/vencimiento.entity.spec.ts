import { Vencimiento } from './vencimiento.entity';
import { TIPO_OBLIGACION, ESTADO_VENCIMIENTO } from '@numerito/shared';
import { VencimientoCumplido } from '../events/vencimiento-cumplido.event';
import { VencimientoVencido } from '../events/vencimiento-vencido.event';
import { VencimientoProrrogado } from '../events/vencimiento-prorrogado.event';

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
    expect(v.fechaNominal).toBeNull();
    expect(v.descripcion).toBe('DDJJ IVA Marzo 2030');
    expect(v.estado).toBe(ESTADO_VENCIMIENTO.PENDIENTE);
    expect(v.motivo).toBeNull();
    expect(v.fechaProrrogada).toBeNull();
    expect(v.responsableId).toBeNull();
  });

  it('should store responsableId when provided on create', () => {
    const v = Vencimiento.create({
      clienteId: 'c1',
      estudioId: 'e1',
      tipoObligacion: TIPO_OBLIGACION.IVA,
      periodo: '2030-03',
      fechaVencimiento: new Date('2030-04-15'),
      descripcion: 'IVA',
      responsableId: 'user-42',
    });
    expect(v.responsableId).toBe('user-42');
  });

  it('should reasignar responsable', () => {
    const v = createVencimiento();
    expect(v.responsableId).toBeNull();
    v.reasignarResponsable('user-99');
    expect(v.responsableId).toBe('user-99');
  });

  it('should store fechaNominal when provided', () => {
    const v = Vencimiento.create({
      clienteId: 'c1',
      estudioId: 'e1',
      tipoObligacion: TIPO_OBLIGACION.IVA,
      periodo: '2030-03',
      fechaVencimiento: new Date('2030-04-17'), // adjusted (Monday)
      fechaNominal: new Date('2030-04-15'), // nominal (Saturday)
      descripcion: 'IVA',
    });
    expect(v.fechaNominal).toEqual(new Date('2030-04-15'));
    expect(v.fechaVencimiento).toEqual(new Date('2030-04-17'));
  });

  it('should reject fechaNominal after fechaVencimiento', () => {
    expect(() =>
      Vencimiento.create({
        clienteId: 'c1',
        estudioId: 'e1',
        tipoObligacion: TIPO_OBLIGACION.IVA,
        periodo: '2030-03',
        fechaVencimiento: new Date('2030-04-15'),
        fechaNominal: new Date('2030-04-20'), // after adjusted — invalid
        descripcion: 'IVA',
      }),
    ).toThrow('La fecha nominal no puede ser posterior a la fecha ajustada');
  });

  describe('prorrogar', () => {
    it('should transition PENDIENTE to PRORROGADO with motivo and nueva fecha', () => {
      const v = createVencimiento();
      const nuevaFecha = new Date('2030-05-01');
      v.prorrogar('Prórroga oficial ARCA RG 1234', nuevaFecha);
      expect(v.estado).toBe(ESTADO_VENCIMIENTO.PRORROGADO);
      expect(v.motivo).toBe('Prórroga oficial ARCA RG 1234');
      expect(v.fechaProrrogada).toEqual(nuevaFecha);
    });

    it('should reject prorrogar from PRESENTADO', () => {
      const v = createVencimiento();
      v.presentar();
      expect(() => v.prorrogar('motivo', new Date('2030-05-01'))).toThrow(
        'Solo se puede prorrogar un vencimiento en estado PENDIENTE',
      );
    });

    it('should reject prorrogar from VENCIDO', () => {
      const v = createVencimiento();
      v.marcarVencido();
      expect(() => v.prorrogar('motivo', new Date('2030-05-01'))).toThrow(
        'Solo se puede prorrogar un vencimiento en estado PENDIENTE',
      );
    });

    it('should reject prorrogar with empty motivo', () => {
      const v = createVencimiento();
      expect(() => v.prorrogar('', new Date('2030-05-01'))).toThrow(
        'El motivo de la prórroga es obligatorio',
      );
    });

    it('should reject prorrogar with whitespace-only motivo', () => {
      const v = createVencimiento();
      expect(() => v.prorrogar('   ', new Date('2030-05-01'))).toThrow(
        'El motivo de la prórroga es obligatorio',
      );
    });

    it('should trim the motivo', () => {
      const v = createVencimiento();
      v.prorrogar('  Prórroga oficial  ', new Date('2030-05-01'));
      expect(v.motivo).toBe('Prórroga oficial');
    });

    it('should emit VencimientoProrrogado event', () => {
      const v = createVencimiento();
      const nuevaFecha = new Date('2030-05-01');
      v.prorrogar('Prórroga oficial', nuevaFecha);
      const events = v.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(VencimientoProrrogado);
      const event = events[0] as VencimientoProrrogado;
      expect(event.vencimientoId).toBe(v.id);
      expect(event.clienteId).toBe('cliente-1');
      expect(event.motivo).toBe('Prórroga oficial');
      expect(event.nuevaFecha).toEqual(nuevaFecha);
      expect(event.eventName).toBe('obligaciones.vencimiento-prorrogado');
    });
  });

  describe('marcarNoAplica', () => {
    it('should transition PENDIENTE to NO_APLICA with motivo', () => {
      const v = createVencimiento();
      v.marcarNoAplica('Cliente dado de baja en ARCA');
      expect(v.estado).toBe(ESTADO_VENCIMIENTO.NO_APLICA);
      expect(v.motivo).toBe('Cliente dado de baja en ARCA');
    });

    it('should reject marcarNoAplica from PRESENTADO', () => {
      const v = createVencimiento();
      v.presentar();
      expect(() => v.marcarNoAplica('motivo')).toThrow(
        'Solo se puede marcar como no aplica un vencimiento en estado PENDIENTE',
      );
    });

    it('should reject marcarNoAplica from VENCIDO', () => {
      const v = createVencimiento();
      v.marcarVencido();
      expect(() => v.marcarNoAplica('motivo')).toThrow(
        'Solo se puede marcar como no aplica un vencimiento en estado PENDIENTE',
      );
    });

    it('should reject marcarNoAplica with empty motivo', () => {
      const v = createVencimiento();
      expect(() => v.marcarNoAplica('')).toThrow(
        'El motivo es obligatorio para marcar como no aplica',
      );
    });

    it('should not emit domain events on marcarNoAplica', () => {
      const v = createVencimiento();
      v.marcarNoAplica('No aplica');
      expect(v.getDomainEvents()).toHaveLength(0);
    });
  });

  describe('presentar from PRORROGADO', () => {
    it('should allow presenting a prorrogado vencimiento', () => {
      const v = createVencimiento();
      v.prorrogar('Prórroga', new Date('2030-05-01'));
      v.clearDomainEvents();
      v.presentar();
      expect(v.estado).toBe(ESTADO_VENCIMIENTO.PRESENTADO);
    });
  });

  describe('marcarVencido restrictions', () => {
    it('should reject marcarVencido from PRESENTADO', () => {
      const v = createVencimiento();
      v.presentar();
      expect(() => v.marcarVencido()).toThrow();
    });

    it('should reject marcarVencido from NO_APLICA', () => {
      const v = createVencimiento();
      v.marcarNoAplica('No aplica');
      expect(() => v.marcarVencido()).toThrow();
    });

    it('should allow marcarVencido from PRORROGADO', () => {
      const v = createVencimiento();
      v.prorrogar('Prórroga', new Date('2030-05-01'));
      v.clearDomainEvents();
      v.marcarVencido();
      expect(v.estado).toBe(ESTADO_VENCIMIENTO.VENCIDO);
    });
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
          fechaNominal: null,
          descripcion: 'IVA viejo',
          estado: ESTADO_VENCIMIENTO.VENCIDO,
          motivo: null,
          fechaProrrogada: null,
          responsableId: null,
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
          fechaNominal: null,
          descripcion: 'Monotributo Junio',
          estado: ESTADO_VENCIMIENTO.PRESENTADO,
          motivo: null,
          fechaProrrogada: null,
          responsableId: null,
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

    it('should preserve responsableId on reconstitute', () => {
      const v = Vencimiento.reconstitute(
        {
          clienteId: 'c1',
          estudioId: 'e1',
          tipoObligacion: TIPO_OBLIGACION.IVA,
          periodo: '2025-06',
          fechaVencimiento: new Date('2025-06-20'),
          fechaNominal: null,
          descripcion: 'IVA',
          estado: ESTADO_VENCIMIENTO.PENDIENTE,
          motivo: null,
          fechaProrrogada: null,
          responsableId: 'user-42',
        },
        'resp-id',
      );
      expect(v.responsableId).toBe('user-42');
    });

    it('should preserve motivo and fechaProrrogada on reconstitute', () => {
      const fechaProrrogada = new Date('2025-07-01');
      const v = Vencimiento.reconstitute(
        {
          clienteId: 'c1',
          estudioId: 'e1',
          tipoObligacion: TIPO_OBLIGACION.IVA,
          periodo: '2025-06',
          fechaVencimiento: new Date('2025-06-20'),
          fechaNominal: null,
          descripcion: 'IVA',
          estado: ESTADO_VENCIMIENTO.PRORROGADO,
          motivo: 'Prórroga RG 1234',
          fechaProrrogada,
          responsableId: null,
        },
        'prorrogado-id',
      );

      expect(v.estado).toBe(ESTADO_VENCIMIENTO.PRORROGADO);
      expect(v.motivo).toBe('Prórroga RG 1234');
      expect(v.fechaProrrogada).toEqual(fechaProrrogada);
    });

    it('should allow domain operations on reconstituted entities', () => {
      const v = Vencimiento.reconstitute(
        {
          clienteId: 'c1',
          estudioId: 'e1',
          tipoObligacion: TIPO_OBLIGACION.IVA,
          periodo: '2020-01',
          fechaVencimiento: new Date('2020-01-15'),
          fechaNominal: null,
          descripcion: 'IVA',
          estado: ESTADO_VENCIMIENTO.PENDIENTE,
          motivo: null,
          fechaProrrogada: null,
          responsableId: null,
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
