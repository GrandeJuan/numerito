import { NotificacionFiscal, ORIGEN_NOTIFICACION, ESTADO_NOTIFICACION } from './notificacion-fiscal.entity';

describe('NotificacionFiscal Entity', () => {
  it('should create a notificacion from ARCA', () => {
    const n = NotificacionFiscal.create({
      clienteId: 'c1',
      tenantId: 't1',
      origen: ORIGEN_NOTIFICACION.ARCA,
      cuitCliente: '20-12345678-6',
      asunto: 'Intimación - Falta de presentación DDJJ IVA',
      contenido: 'Se intima a presentar la DDJJ...',
      fechaNotificacion: new Date('2026-03-28'),
    });
    expect(n.id).toBeDefined();
    expect(n.estado).toBe(ESTADO_NOTIFICACION.PENDIENTE);
    expect(n.origen).toBe(ORIGEN_NOTIFICACION.ARCA);
  });

  it('should mark as leida', () => {
    const n = NotificacionFiscal.create({
      clienteId: 'c1',
      tenantId: 't1',
      origen: ORIGEN_NOTIFICACION.ARBA,
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
      origen: ORIGEN_NOTIFICACION.AGIP,
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
});
