import { EjecucionIngestaMapper } from './ejecucion-ingesta.mapper';
import {
  EjecucionIngesta,
  ESTADO_EJECUCION,
  DISPARADOR_INGESTA,
} from '../../domain/entities/ejecucion-ingesta.entity';
import { FUENTE_INGESTA } from '../../domain/entities/configuracion-ingesta.entity';

describe('EjecucionIngestaMapper', () => {
  const mapper = new EjecucionIngestaMapper();

  const validPersistence = {
    id: 'test-uuid',
    fuente: FUENTE_INGESTA.ARCA,
    estado: ESTADO_EJECUCION.EXITOSA,
    disparador: DISPARADOR_INGESTA.MANUAL,
    disparadoPor: 'admin-1',
    ingestaId: 'evt-123',
    inicio: new Date('2026-04-01T10:00:00Z'),
    fin: new Date('2026-04-01T10:05:00Z'),
    reglasNuevas: 3,
    reglasModificadas: 1,
    errores: [],
  };

  it('should map persistence -> domain', () => {
    const domain = mapper.toDomain(validPersistence);
    expect(domain.id).toBe('test-uuid');
    expect(domain.fuente).toBe('ARCA');
    expect(domain.estado).toBe('EXITOSA');
    expect(domain.disparador).toBe('MANUAL');
    expect(domain.disparadoPor).toBe('admin-1');
    expect(domain.ingestaId).toBe('evt-123');
    expect(domain.reglasNuevas).toBe(3);
    expect(domain.reglasModificadas).toBe(1);
  });

  it('should map domain -> persistence', () => {
    const domain = EjecucionIngesta.create({
      fuente: FUENTE_INGESTA.ARBA,
      disparador: DISPARADOR_INGESTA.SCHEDULE,
    });
    domain.completarExitosa(5, 2);
    const persistence = mapper.toPersistence(domain);
    expect(persistence.fuente).toBe('ARBA');
    expect(persistence.estado).toBe('EXITOSA');
    expect(persistence.reglasNuevas).toBe(5);
    expect(persistence.reglasModificadas).toBe(2);
    expect(persistence.id).toBe(domain.id);
  });

  it('should round-trip toPersistence -> toDomain', () => {
    const original = EjecucionIngesta.create({
      fuente: FUENTE_INGESTA.AGIP,
      disparador: DISPARADOR_INGESTA.MANUAL,
      disparadoPor: 'user-x',
    });
    original.completarFallida(['error-1']);
    const persistence = mapper.toPersistence(original);
    const reconstituted = mapper.toDomain(persistence);
    expect(reconstituted.id).toBe(original.id);
    expect(reconstituted.fuente).toBe(original.fuente);
    expect(reconstituted.estado).toBe(original.estado);
    expect(reconstituted.errores).toEqual(['error-1']);
  });

  it('should map fromSchema (ORM entity)', () => {
    const now = new Date();
    const ormEntity = {
      id: 'orm-id',
      fuente: 'ARCA',
      estado: 'EN_CURSO',
      disparador: 'SCHEDULE',
      disparadoPor: null,
      ingestaId: null,
      inicio: now,
      fin: null,
      reglasNuevas: 0,
      reglasModificadas: 0,
      errores: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const persistence = mapper.fromSchema(ormEntity as any);
    expect(persistence.id).toBe('orm-id');
    expect(persistence.fuente).toBe('ARCA');
    expect(persistence.estado).toBe('EN_CURSO');
    expect(persistence.inicio).toEqual(now);
    expect(persistence.fin).toBeNull();
  });
});
