import { ConfiguracionIngestaMapper } from './configuracion-ingesta.mapper';
import { ConfiguracionIngesta, FUENTE_INGESTA } from '../../domain/entities/configuracion-ingesta.entity';

describe('ConfiguracionIngestaMapper', () => {
  const mapper = new ConfiguracionIngestaMapper();

  const validPersistence = {
    id: 'test-uuid',
    fuente: FUENTE_INGESTA.ARCA,
    habilitado: false,
    cadenciaDias: 7,
    proximaEjecucion: null,
    ultimaEjecucion: null,
    ultimoResultado: null,
  };

  it('should map persistence → domain', () => {
    const domain = mapper.toDomain(validPersistence);
    expect(domain.id).toBe('test-uuid');
    expect(domain.fuente).toBe('ARCA');
    expect(domain.habilitado).toBe(false);
    expect(domain.cadenciaDias).toBe(7);
    expect(domain.proximaEjecucion).toBeNull();
    expect(domain.ultimaEjecucion).toBeNull();
    expect(domain.ultimoResultado).toBeNull();
  });

  it('should map domain → persistence', () => {
    const domain = ConfiguracionIngesta.create({
      fuente: FUENTE_INGESTA.BCRA_FERIADOS,
      cadenciaDias: 30,
    });
    const persistence = mapper.toPersistence(domain);
    expect(persistence.fuente).toBe('BCRA_FERIADOS');
    expect(persistence.cadenciaDias).toBe(30);
    expect(persistence.id).toBe(domain.id);
    expect(persistence.habilitado).toBe(false);
  });

  it('should round-trip toPersistence → toDomain', () => {
    const original = ConfiguracionIngesta.create({
      fuente: FUENTE_INGESTA.ARBA,
      cadenciaDias: 7,
      habilitado: true,
    });
    const persistence = mapper.toPersistence(original);
    const reconstituted = mapper.toDomain(persistence);
    expect(reconstituted.id).toBe(original.id);
    expect(reconstituted.fuente).toBe(original.fuente);
    expect(reconstituted.habilitado).toBe(original.habilitado);
    expect(reconstituted.cadenciaDias).toBe(original.cadenciaDias);
  });

  it('should map fromSchema (ORM entity)', () => {
    const now = new Date();
    const ormEntity = {
      id: 'orm-id',
      fuente: 'AGIP',
      habilitado: true,
      cadenciaDias: 7,
      proximaEjecucion: now,
      ultimaEjecucion: now,
      ultimoResultado: 'OK: 3 reglas',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const persistence = mapper.fromSchema(ormEntity as any);
    expect(persistence.id).toBe('orm-id');
    expect(persistence.fuente).toBe('AGIP');
    expect(persistence.habilitado).toBe(true);
    expect(persistence.proximaEjecucion).toEqual(now);
    expect(persistence.ultimoResultado).toBe('OK: 3 reglas');
  });
});
