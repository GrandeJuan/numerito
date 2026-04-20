import { Estudio } from '../../domain/entities/estudio.entity';
import { NombreEstudio } from '../../domain/value-objects/nombre-estudio.vo';
import { PlanSubscripcion } from '../../domain/value-objects/plan-subscripcion.vo';
import { EstudioMapper, estudioPersistenceSchema, type EstudioPersistence } from './estudio.mapper';
import type { EstudioEntity } from './estudio.schema';

describe('EstudioMapper', () => {
  const mapper = new EstudioMapper();
  const validId = '11111111-1111-1111-1111-111111111111';

  const validPersistence: EstudioPersistence = {
    id: validId,
    nombre: 'Estudio Contable Rodriguez',
    planCodigo: 'PROFESIONAL',
    planMaxClientes: 50,
    planMaxUsuarios: 5,
    cuit: '20-12345678-9',
    isActive: true,
  };

  describe('toDomain', () => {
    it('reconstitutes an Estudio preserving all fields', () => {
      const estudio = mapper.toDomain(validPersistence);

      expect(estudio).toBeInstanceOf(Estudio);
      expect(estudio.id).toBe(validId);
      expect(estudio.nombre.value).toBe('Estudio Contable Rodriguez');
      expect(estudio.plan.value).toBe('PROFESIONAL');
      expect(estudio.plan.maxClientes).toBe(50);
      expect(estudio.plan.maxUsuarios).toBe(5);
      expect(estudio.cuit).toBe('20-12345678-9');
      expect(estudio.isActive).toBe(true);
    });

    it('preserves inactive state', () => {
      const estudio = mapper.toDomain({ ...validPersistence, isActive: false });
      expect(estudio.isActive).toBe(false);
    });

    it('does not emit domain events on reconstitution', () => {
      const estudio = mapper.toDomain(validPersistence);
      expect(estudio.getDomainEvents()).toHaveLength(0);
    });

    it('rejects malformed persistence (Zod validation)', () => {
      const bad = { ...validPersistence, id: '' };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects missing required fields (Zod validation)', () => {
      const bad = { ...validPersistence } as Partial<EstudioPersistence>;
      delete bad.nombre;
      expect(() => mapper.toDomain(bad as EstudioPersistence)).toThrow();
    });

    it('rejects wrong types (Zod validation)', () => {
      const bad = { ...validPersistence, isActive: 'true' as unknown as boolean };
      expect(() => mapper.toDomain(bad)).toThrow();
    });
  });

  describe('toPersistence', () => {
    it('extracts the flat persistence shape from a domain Estudio', () => {
      const estudio = Estudio.reconstitute(
        {
          nombre: NombreEstudio.create('Estudio Contable Rodriguez'),
          plan: PlanSubscripcion.create('PROFESIONAL' as any, 50, 5),
          cuit: '20-12345678-9',
          isActive: true,
        },
        validId,
      );

      expect(mapper.toPersistence(estudio)).toEqual(validPersistence);
    });

    it('produces output that satisfies the persistence schema', () => {
      const estudio = mapper.toDomain(validPersistence);
      const out = mapper.toPersistence(estudio);
      expect(() => estudioPersistenceSchema.parse(out)).not.toThrow();
    });
  });

  describe('round-trip', () => {
    it('toDomain -> toPersistence is the identity for valid input', () => {
      const estudio = mapper.toDomain(validPersistence);
      expect(mapper.toPersistence(estudio)).toEqual(validPersistence);
    });
  });

  describe('fromSchema', () => {
    it('flattens populated FK references into flat persistence shape', () => {
      const schemaEntity = {
        id: validId,
        nombre: 'Estudio Contable Rodriguez',
        plan: { codigo: 'PROFESIONAL', maxClientes: 50, maxUsuarios: 5 },
        cuit: '20-12345678-9',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as EstudioEntity;

      expect(mapper.fromSchema(schemaEntity)).toEqual(validPersistence);
    });

    it('output of fromSchema is consumable by toDomain', () => {
      const schemaEntity = {
        id: validId,
        nombre: 'Estudio Contable Rodriguez',
        plan: { codigo: 'PROFESIONAL', maxClientes: 50, maxUsuarios: 5 },
        cuit: '20-12345678-9',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as EstudioEntity;

      const estudio = mapper.toDomain(mapper.fromSchema(schemaEntity));
      expect(estudio.id).toBe(validId);
      expect(estudio.nombre.value).toBe('Estudio Contable Rodriguez');
    });
  });
});
