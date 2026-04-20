import { RecordatorioEnviadoMapper } from './recordatorio-enviado.mapper';
import {
  RecordatorioEnviado,
  TIPO_RECORDATORIO,
  CANAL_RECORDATORIO,
} from '../../domain/entities/recordatorio-enviado.entity';

describe('RecordatorioEnviadoMapper', () => {
  const mapper = new RecordatorioEnviadoMapper();

  const persistence = {
    id: 'rec-1',
    vencimientoId: 'venc-1',
    estudioId: 'estudio-1',
    clienteId: 'cliente-1',
    tipoRecordatorio: TIPO_RECORDATORIO.ANTICIPACION,
    canal: CANAL_RECORDATORIO.EMAIL,
    destinatarioId: 'cliente-1',
    fechaEnvio: new Date('2026-04-15T10:00:00Z'),
  };

  it('should map persistence to domain', () => {
    const domain = mapper.toDomain(persistence);
    expect(domain.id).toBe('rec-1');
    expect(domain.vencimientoId).toBe('venc-1');
    expect(domain.estudioId).toBe('estudio-1');
    expect(domain.clienteId).toBe('cliente-1');
    expect(domain.tipoRecordatorio).toBe(TIPO_RECORDATORIO.ANTICIPACION);
    expect(domain.canal).toBe(CANAL_RECORDATORIO.EMAIL);
    expect(domain.destinatarioId).toBe('cliente-1');
    expect(domain.fechaEnvio).toEqual(new Date('2026-04-15T10:00:00Z'));
  });

  it('should map domain to persistence', () => {
    const domain = RecordatorioEnviado.create({
      vencimientoId: 'venc-2',
      estudioId: 'estudio-2',
      clienteId: 'cliente-2',
      tipoRecordatorio: TIPO_RECORDATORIO.EN_RIESGO,
      canal: CANAL_RECORDATORIO.INTERNAL,
      destinatarioId: 'user-resp-1',
    });

    const result = mapper.toPersistence(domain);
    expect(result.vencimientoId).toBe('venc-2');
    expect(result.estudioId).toBe('estudio-2');
    expect(result.tipoRecordatorio).toBe(TIPO_RECORDATORIO.EN_RIESGO);
    expect(result.canal).toBe(CANAL_RECORDATORIO.INTERNAL);
  });

  it('should round-trip correctly', () => {
    const domain = mapper.toDomain(persistence);
    const backToPersistence = mapper.toPersistence(domain);
    expect(backToPersistence).toEqual(persistence);
  });

  it('should map from schema entity', () => {
    const schemaEntity = {
      id: 'rec-1',
      vencimiento: { id: 'venc-1' },
      estudio: { id: 'estudio-1' },
      clienteId: 'cliente-1',
      tipoRecordatorio: TIPO_RECORDATORIO.ANTICIPACION,
      canal: CANAL_RECORDATORIO.EMAIL,
      destinatarioId: 'cliente-1',
      fechaEnvio: new Date('2026-04-15T10:00:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    const result = mapper.fromSchema(schemaEntity);
    expect(result.id).toBe('rec-1');
    expect(result.vencimientoId).toBe('venc-1');
    expect(result.estudioId).toBe('estudio-1');
  });
});
