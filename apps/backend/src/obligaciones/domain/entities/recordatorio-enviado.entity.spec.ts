import {
  RecordatorioEnviado,
  TIPO_RECORDATORIO,
  CANAL_RECORDATORIO,
} from './recordatorio-enviado.entity';

describe('RecordatorioEnviado Entity', () => {
  const defaultProps = {
    vencimientoId: 'venc-1',
    estudioId: 'estudio-1',
    clienteId: 'cliente-1',
    tipoRecordatorio: TIPO_RECORDATORIO.ANTICIPACION as const,
    canal: CANAL_RECORDATORIO.EMAIL as const,
    destinatarioId: 'cliente-1',
  };

  it('should create with all fields', () => {
    const r = RecordatorioEnviado.create(defaultProps);
    expect(r.id).toBeDefined();
    expect(r.vencimientoId).toBe('venc-1');
    expect(r.estudioId).toBe('estudio-1');
    expect(r.clienteId).toBe('cliente-1');
    expect(r.tipoRecordatorio).toBe(TIPO_RECORDATORIO.ANTICIPACION);
    expect(r.canal).toBe(CANAL_RECORDATORIO.EMAIL);
    expect(r.destinatarioId).toBe('cliente-1');
    expect(r.fechaEnvio).toBeInstanceOf(Date);
  });

  it('should create EN_RIESGO type', () => {
    const r = RecordatorioEnviado.create({
      ...defaultProps,
      tipoRecordatorio: TIPO_RECORDATORIO.EN_RIESGO,
      canal: CANAL_RECORDATORIO.INTERNAL,
      destinatarioId: 'responsable-1',
    });
    expect(r.tipoRecordatorio).toBe(TIPO_RECORDATORIO.EN_RIESGO);
    expect(r.canal).toBe(CANAL_RECORDATORIO.INTERNAL);
  });

  it('should reconstitute from persistence', () => {
    const r = RecordatorioEnviado.reconstitute(
      {
        vencimientoId: 'venc-1',
        estudioId: 'estudio-1',
        clienteId: 'cliente-1',
        tipoRecordatorio: TIPO_RECORDATORIO.ANTICIPACION,
        canal: CANAL_RECORDATORIO.EMAIL,
        destinatarioId: 'cliente-1',
        fechaEnvio: new Date('2026-04-15'),
      },
      'rec-id-1',
    );
    expect(r.id).toBe('rec-id-1');
    expect(r.vencimientoId).toBe('venc-1');
    expect(r.fechaEnvio).toEqual(new Date('2026-04-15'));
  });

  it('should set fechaEnvio to now on create', () => {
    const before = new Date();
    const r = RecordatorioEnviado.create(defaultProps);
    const after = new Date();
    expect(r.fechaEnvio.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(r.fechaEnvio.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});
