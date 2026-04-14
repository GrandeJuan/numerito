import { Notificacion, TipoNotificacion } from './notificacion.entity';

describe('Notificacion', () => {
  const validProps = {
    usuarioId: 'user-1',
    estudioId: 'est-1',
    tipo: TipoNotificacion.VENCIMIENTO_PROXIMO,
    mensaje: 'Vencimiento de IVA en 3 dias',
  };

  it('should create a notificacion with all fields', () => {
    const notif = Notificacion.create(validProps);

    expect(notif.id).toBeDefined();
    expect(notif.usuarioId).toBe('user-1');
    expect(notif.estudioId).toBe('est-1');
    expect(notif.tipo).toBe(TipoNotificacion.VENCIMIENTO_PROXIMO);
    expect(notif.mensaje).toBe('Vencimiento de IVA en 3 dias');
    expect(notif.leida).toBe(false);
    expect(notif.createdAt).toBeInstanceOf(Date);
  });

  it('should create with optional estudioId as undefined', () => {
    const notif = Notificacion.create({
      ...validProps,
      estudioId: undefined,
    });

    expect(notif.estudioId).toBeUndefined();
  });

  it('should create with a given id', () => {
    const notif = Notificacion.create(validProps, 'custom-id');

    expect(notif.id).toBe('custom-id');
  });

  it('should mark as read via marcarLeida()', () => {
    const notif = Notificacion.create(validProps);
    expect(notif.leida).toBe(false);

    notif.marcarLeida();

    expect(notif.leida).toBe(true);
  });

  it('marcarLeida() is idempotent', () => {
    const notif = Notificacion.create(validProps);
    notif.marcarLeida();
    notif.marcarLeida();

    expect(notif.leida).toBe(true);
  });

  it('should expose all TipoNotificacion values', () => {
    expect(TipoNotificacion.VENCIMIENTO_PROXIMO).toBe('VENCIMIENTO_PROXIMO');
    expect(TipoNotificacion.TAREA_ASIGNADA).toBe('TAREA_ASIGNADA');
    expect(TipoNotificacion.PAGO_RECIBIDO).toBe('PAGO_RECIBIDO');
    expect(TipoNotificacion.SISTEMA).toBe('SISTEMA');
  });

  describe('reconstitute', () => {
    it('should preserve all fields including leida state', () => {
      const notif = Notificacion.reconstitute(
        {
          usuarioId: 'user-1',
          estudioId: 'est-1',
          tipo: TipoNotificacion.PAGO_RECIBIDO,
          mensaje: 'Pago registrado',
          leida: true,
        },
        'existing-id',
      );

      expect(notif.id).toBe('existing-id');
      expect(notif.usuarioId).toBe('user-1');
      expect(notif.estudioId).toBe('est-1');
      expect(notif.tipo).toBe(TipoNotificacion.PAGO_RECIBIDO);
      expect(notif.mensaje).toBe('Pago registrado');
      expect(notif.leida).toBe(true);
    });

    it('should not emit domain events on reconstitute', () => {
      const notif = Notificacion.reconstitute(
        {
          usuarioId: 'user-1',
          tipo: TipoNotificacion.SISTEMA,
          mensaje: 'Test',
          leida: false,
        },
        'id-1',
      );

      expect(notif.getDomainEvents()).toHaveLength(0);
    });

    it('should allow domain operations on reconstituted entities', () => {
      const notif = Notificacion.reconstitute(
        {
          usuarioId: 'user-1',
          tipo: TipoNotificacion.TAREA_ASIGNADA,
          mensaje: 'Tarea asignada',
          leida: false,
        },
        'id-1',
      );

      notif.marcarLeida();
      expect(notif.leida).toBe(true);
    });
  });
});
