import {
  LibroContable,
  TIPO_LIBRO,
} from '../../domain/entities/libro-contable.entity';
import {
  LibroContableMapper,
  libroContablePersistenceSchema,
  type LibroContablePersistence,
} from './libro-contable.mapper';
import type { LibroContableEntity } from './libro-contable.schema';

describe('LibroContableMapper', () => {
  const mapper = new LibroContableMapper();
  const validId = '11111111-1111-1111-1111-111111111111';
  const clienteId = '22222222-2222-2222-2222-222222222222';
  const estudioId = '33333333-3333-3333-3333-333333333333';

  const validPersistence: LibroContablePersistence = {
    id: validId,
    clienteId,
    estudioId,
    tipo: TIPO_LIBRO.DIARIO,
    periodo: '2026',
    isRubricado: false,
  };

  describe('toDomain', () => {
    it('reconstitutes a LibroContable preserving all fields', () => {
      const libro = mapper.toDomain(validPersistence);

      expect(libro).toBeInstanceOf(LibroContable);
      expect(libro.id).toBe(validId);
      expect(libro.clienteId).toBe(clienteId);
      expect(libro.estudioId).toBe(estudioId);
      expect(libro.tipo).toBe(TIPO_LIBRO.DIARIO);
      expect(libro.periodo).toBe('2026');
      expect(libro.isRubricado).toBe(false);
      expect(libro.numeroRubrica).toBeUndefined();
    });

    it('preserves rubricado state with numeroRubrica', () => {
      const libro = mapper.toDomain({
        ...validPersistence,
        isRubricado: true,
        numeroRubrica: 'RUB-2026-001',
      });
      expect(libro.isRubricado).toBe(true);
      expect(libro.numeroRubrica).toBe('RUB-2026-001');
    });

    it('does not emit domain events on reconstitution', () => {
      const libro = mapper.toDomain(validPersistence);
      expect(libro.getDomainEvents()).toHaveLength(0);
    });

    it('rejects malformed persistence id (Zod validation)', () => {
      expect(() =>
        mapper.toDomain({ ...validPersistence, id: 'not-a-uuid' }),
      ).toThrow();
    });

    it('rejects missing required fields (Zod validation)', () => {
      const bad = { ...validPersistence } as Partial<LibroContablePersistence>;
      delete bad.periodo;
      expect(() =>
        mapper.toDomain(bad as LibroContablePersistence),
      ).toThrow();
    });

    it('rejects empty periodo (Zod validation)', () => {
      expect(() =>
        mapper.toDomain({ ...validPersistence, periodo: '' }),
      ).toThrow();
    });

    it('rejects unknown tipo codes (Zod validation)', () => {
      const bad = {
        ...validPersistence,
        tipo: 'NOT_A_TIPO' as LibroContablePersistence['tipo'],
      };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects wrong types (Zod validation)', () => {
      const bad = {
        ...validPersistence,
        isRubricado: 'true' as unknown as boolean,
      };
      expect(() => mapper.toDomain(bad)).toThrow();
    });
  });

  describe('toPersistence', () => {
    it('extracts the flat persistence shape from a domain LibroContable', () => {
      const libro = LibroContable.reconstitute(
        {
          clienteId,
          estudioId,
          tipo: TIPO_LIBRO.DIARIO,
          periodo: '2026',
          isRubricado: false,
        },
        validId,
      );

      expect(mapper.toPersistence(libro)).toEqual(validPersistence);
    });

    it('reflects mutations made via domain methods (rubricar)', () => {
      const libro = mapper.toDomain(validPersistence);
      libro.rubricar('RUB-2026-001');

      const persistence = mapper.toPersistence(libro);
      expect(persistence.isRubricado).toBe(true);
      expect(persistence.numeroRubrica).toBe('RUB-2026-001');
    });

    it('produces output that satisfies the persistence schema', () => {
      const libro = mapper.toDomain(validPersistence);
      const out = mapper.toPersistence(libro);
      expect(() => libroContablePersistenceSchema.parse(out)).not.toThrow();
    });
  });

  describe('round-trip', () => {
    it('toDomain -> toPersistence is the identity for valid input', () => {
      const libro = mapper.toDomain(validPersistence);
      expect(mapper.toPersistence(libro)).toEqual(validPersistence);
    });

    it('preserves rubricado round-trip', () => {
      const rubricado: LibroContablePersistence = {
        ...validPersistence,
        isRubricado: true,
        numeroRubrica: 'RUB-2026-001',
      };
      const libro = mapper.toDomain(rubricado);
      expect(mapper.toPersistence(libro)).toEqual(rubricado);
    });
  });

  describe('fromSchema', () => {
    const schemaEntity = {
      id: validId,
      cliente: { id: clienteId },
      estudio: { id: estudioId },
      tipoLibro: { codigo: TIPO_LIBRO.DIARIO },
      periodo: '2026',
      isRubricado: false,
      numeroRubrica: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as LibroContableEntity;

    it('flattens populated FK references into ids and codes', () => {
      expect(mapper.fromSchema(schemaEntity)).toEqual(validPersistence);
    });

    it('output of fromSchema is consumable by toDomain', () => {
      const libro = mapper.toDomain(mapper.fromSchema(schemaEntity));
      expect(libro.id).toBe(validId);
      expect(libro.clienteId).toBe(clienteId);
      expect(libro.estudioId).toBe(estudioId);
      expect(libro.tipo).toBe(TIPO_LIBRO.DIARIO);
    });

    it('preserves numeroRubrica when the libro is rubricado', () => {
      const entity = {
        ...schemaEntity,
        isRubricado: true,
        numeroRubrica: 'RUB-2026-001',
      } as unknown as LibroContableEntity;
      const flat = mapper.fromSchema(entity);
      expect(flat.isRubricado).toBe(true);
      expect(flat.numeroRubrica).toBe('RUB-2026-001');
    });
  });
});
