import {
  SugerenciaProrroga,
  ESTADO_SUGERENCIA,
} from '../../domain/entities/sugerencia-prorroga.entity';
import {
  SugerenciaProrrogaMapper,
  sugerenciaProrrogaPersistenceSchema,
  type SugerenciaProrrogaPersistence,
} from './sugerencia-prorroga.mapper';
import type { SugerenciaProrrogaEntity } from './sugerencia-prorroga.schema';

describe('SugerenciaProrrogaMapper', () => {
  const mapper = new SugerenciaProrrogaMapper();
  const validId = '11111111-1111-1111-1111-111111111111';
  const vencimientoId = '22222222-2222-2222-2222-222222222222';
  const estudioId = '33333333-3333-3333-3333-333333333333';

  const validPersistence: SugerenciaProrrogaPersistence = {
    id: validId,
    vencimientoId,
    estudioId,
    clienteId: 'cli-1',
    tipoObligacion: 'IVA',
    periodo: '2026-05',
    fechaOriginal: new Date('2026-05-20'),
    fechaSugerida: new Date('2026-05-22'),
    motivo: 'diaVencimiento: 20 → 22',
    estado: ESTADO_SUGERENCIA.ABIERTA,
    reglaActivaId: 'regla-1',
    ejecucionIngestaId: 'ejec-1',
  };

  describe('toDomain', () => {
    it('reconstitutes a SugerenciaProrroga preserving all fields', () => {
      const entity = mapper.toDomain(validPersistence);

      expect(entity).toBeInstanceOf(SugerenciaProrroga);
      expect(entity.id).toBe(validId);
      expect(entity.vencimientoId).toBe(vencimientoId);
      expect(entity.estudioId).toBe(estudioId);
      expect(entity.clienteId).toBe('cli-1');
      expect(entity.tipoObligacion).toBe('IVA');
      expect(entity.periodo).toBe('2026-05');
      expect(entity.fechaOriginal).toEqual(new Date('2026-05-20'));
      expect(entity.fechaSugerida).toEqual(new Date('2026-05-22'));
      expect(entity.motivo).toBe('diaVencimiento: 20 → 22');
      expect(entity.estado).toBe(ESTADO_SUGERENCIA.ABIERTA);
      expect(entity.reglaActivaId).toBe('regla-1');
      expect(entity.ejecucionIngestaId).toBe('ejec-1');
    });
  });

  describe('toPersistence', () => {
    it('maps domain to persistence', () => {
      const domain = SugerenciaProrroga.create({
        vencimientoId,
        estudioId,
        clienteId: 'cli-1',
        tipoObligacion: 'IVA',
        periodo: '2026-05',
        fechaOriginal: new Date('2026-05-20'),
        fechaSugerida: new Date('2026-05-22'),
        motivo: 'diaVencimiento: 20 → 22',
        reglaActivaId: 'regla-1',
        ejecucionIngestaId: null,
      });
      const persistence = mapper.toPersistence(domain);

      expect(persistence.vencimientoId).toBe(vencimientoId);
      expect(persistence.estado).toBe(ESTADO_SUGERENCIA.ABIERTA);
      expect(persistence.ejecucionIngestaId).toBeNull();
    });
  });

  describe('fromSchema', () => {
    it('extracts IDs from MikroORM entity references', () => {
      const schemaEntity = {
        id: validId,
        vencimiento: { id: vencimientoId },
        estudio: { id: estudioId },
        clienteId: 'cli-1',
        tipoObligacion: 'IVA',
        periodo: '2026-05',
        fechaOriginal: new Date('2026-05-20'),
        fechaSugerida: new Date('2026-05-22'),
        motivo: 'diaVencimiento: 20 → 22',
        estado: 'ABIERTA',
        reglaActivaId: null,
        ejecucionIngestaId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as SugerenciaProrrogaEntity;

      const result = mapper.fromSchema(schemaEntity);
      expect(result.vencimientoId).toBe(vencimientoId);
      expect(result.estudioId).toBe(estudioId);
      expect(result.estado).toBe(ESTADO_SUGERENCIA.ABIERTA);
    });
  });

  describe('round-trip', () => {
    it('domain → persistence → domain preserves all fields', () => {
      const original = SugerenciaProrroga.create({
        vencimientoId,
        estudioId,
        clienteId: 'cli-1',
        tipoObligacion: 'SICOSS',
        periodo: '2026-06',
        fechaOriginal: new Date('2026-06-10'),
        fechaSugerida: new Date('2026-06-12'),
        motivo: 'mesSiguiente: true → false',
        reglaActivaId: 'regla-2',
        ejecucionIngestaId: 'ejec-2',
      });
      const persistence = mapper.toPersistence(original);
      const restored = mapper.toDomain(persistence);

      expect(restored.id).toBe(original.id);
      expect(restored.vencimientoId).toBe(original.vencimientoId);
      expect(restored.tipoObligacion).toBe(original.tipoObligacion);
      expect(restored.motivo).toBe(original.motivo);
      expect(restored.estado).toBe(original.estado);
    });
  });

  describe('persistence schema validation', () => {
    it('rejects invalid estado', () => {
      expect(() =>
        sugerenciaProrrogaPersistenceSchema.parse({ ...validPersistence, estado: 'INVALID' }),
      ).toThrow();
    });

    it('rejects empty motivo', () => {
      expect(() =>
        sugerenciaProrrogaPersistenceSchema.parse({ ...validPersistence, motivo: '' }),
      ).toThrow();
    });
  });
});
