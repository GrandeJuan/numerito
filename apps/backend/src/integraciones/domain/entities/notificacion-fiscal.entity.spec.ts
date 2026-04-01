import { NotificacionFiscal, ESTADO_NOTIFICACION } from './notificacion-fiscal.entity';

describe('NotificacionFiscal Entity', () => {
  it('should create a notificacion with organismoId from DB', () => {
    const n = NotificacionFiscal.create({
      clienteId: 'c1',
      tenantId: 't1',
      organismoId: 'org-arca-1',
      cuitCliente: '20-12345678-6',
      asunto: 'Intimación - Falta de presentación DDJJ IVA',
      contenido: 'Se intima a presentar la DDJJ...',
      fechaNotificacion: new Date('2026-03-28'),
    });
    expect(n.id).toBeDefined();
    expect(n.estado).toBe(ESTADO_NOTIFICACION.PENDIENTE);
    expect(n.organismoId).toBe('org-arca-1');
  });

  it('should mark as leida', () => {
    const n = NotificacionFiscal.create({
      clienteId: 'c1',
      tenantId: 't1',
      organismoId: 'org-arba-1',
      cuitCliente: '20-12345678-6',
      asunto: 'Retención IIBB',
      contenido: 'Certificado de retención...',
      fechaNotificacion: new Date(),
    });
    n.marcarLeida();
    expect(n.estado).toBe(ESTADO_NOTIFICACION.LEIDA);
  });

  it('should mark as gestionada', () => {
    const n = NotificacionFiscal.create({
      clienteId: 'c1',
      tenantId: 't1',
      organismoId: 'org-agip-1',
      cuitCliente: '20-12345678-6',
      asunto: 'Vencimiento IIBB CABA',
      contenido: 'Recordatorio...',
      fechaNotificacion: new Date(),
    });
    n.marcarLeida();
    n.marcarGestionada('Se presentó la DDJJ correspondiente');
    expect(n.estado).toBe(ESTADO_NOTIFICACION.GESTIONADA);
    expect(n.notaGestion).toBe('Se presentó la DDJJ correspondiente');
  });

  it('should expose all getters', () => {
    const fecha = new Date('2026-03-28');
    const n = NotificacionFiscal.create({
      clienteId: 'c1',
      tenantId: 't1',
      organismoId: 'org-arca-1',
      cuitCliente: '20-12345678-6',
      asunto: 'Intimación',
      contenido: 'Se intima...',
      fechaNotificacion: fecha,
    });
    expect(n.clienteId).toBe('c1');
    expect(n.tenantId).toBe('t1');
    expect(n.organismoId).toBe('org-arca-1');
    expect(n.cuitCliente).toBe('20-12345678-6');
    expect(n.asunto).toBe('Intimación');
    expect(n.contenido).toBe('Se intima...');
    expect(n.fechaNotificacion).toBe(fecha);
    expect(n.estado).toBe(ESTADO_NOTIFICACION.PENDIENTE);
    expect(n.notaGestion).toBeUndefined();
  });
});
