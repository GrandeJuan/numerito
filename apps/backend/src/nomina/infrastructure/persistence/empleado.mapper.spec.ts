import { Empleado } from '../../domain/entities/empleado.entity';
import {
  EmpleadoMapper,
  empleadoPersistenceSchema,
  type EmpleadoPersistence,
} from './empleado.mapper';
import type { EmpleadoEntity } from './empleado.schema';

describe('EmpleadoMapper', () => {
  const mapper = new EmpleadoMapper();
  const validId = '11111111-1111-1111-1111-111111111111';
  const clienteId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  const estudioId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  const fechaIngreso = new Date('2023-03-15');

  const validPersistence: EmpleadoPersistence = {
    id: validId,
    clienteId,
    estudioId,
    nombre: 'Juan',
    apellido: 'Pérez',
    cuil: '20-12345678-6',
    fechaIngreso,
    sueldoBasico: 250000,
    categoriaConvenio: 'Auxiliar',
    isActive: true,
  };

  describe('toDomain', () => {
    it('reconstitutes an Empleado preserving all fields', () => {
      const empleado = mapper.toDomain(validPersistence);

      expect(empleado).toBeInstanceOf(Empleado);
      expect(empleado.id).toBe(validId);
      expect(empleado.clienteId).toBe(clienteId);
      expect(empleado.estudioId).toBe(estudioId);
      expect(empleado.nombre).toBe('Juan');
      expect(empleado.apellido).toBe('Pérez');
      expect(empleado.cuil).toBe('20-12345678-6');
      expect(empleado.fechaIngreso).toEqual(fechaIngreso);
      expect(empleado.sueldoBasico).toBe(250000);
      expect(empleado.categoriaConvenio).toBe('Auxiliar');
      expect(empleado.isActive).toBe(true);
    });

    it('handles optional fechaEgreso when present', () => {
      const fechaEgreso = new Date('2024-06-30');
      const empleado = mapper.toDomain({ ...validPersistence, fechaEgreso });
      expect(empleado.fechaEgreso).toEqual(fechaEgreso);
    });

    it('omits fechaEgreso when not present', () => {
      const empleado = mapper.toDomain(validPersistence);
      expect(empleado.fechaEgreso).toBeUndefined();
    });

    it('preserves inactive state', () => {
      const empleado = mapper.toDomain({ ...validPersistence, isActive: false });
      expect(empleado.isActive).toBe(false);
    });

    it('does not emit domain events on reconstitution', () => {
      const empleado = mapper.toDomain(validPersistence);
      expect(empleado.getDomainEvents()).toHaveLength(0);
    });

    it('rejects malformed persistence id (Zod validation)', () => {
      const bad = { ...validPersistence, id: 'not-a-uuid' };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects missing required fields (Zod validation)', () => {
      const bad = { ...validPersistence } as Partial<EmpleadoPersistence>;
      delete bad.nombre;
      expect(() => mapper.toDomain(bad as EmpleadoPersistence)).toThrow();
    });

    it('rejects wrong types (Zod validation)', () => {
      const bad = { ...validPersistence, isActive: 'true' as unknown as boolean };
      expect(() => mapper.toDomain(bad)).toThrow();
    });
  });

  describe('toPersistence', () => {
    it('extracts the flat persistence shape from a domain Empleado', () => {
      const empleado = mapper.toDomain(validPersistence);
      expect(mapper.toPersistence(empleado)).toEqual(validPersistence);
    });

    it('includes fechaEgreso when present', () => {
      const fechaEgreso = new Date('2024-06-30');
      const empleado = mapper.toDomain({ ...validPersistence, fechaEgreso, isActive: false });
      expect(mapper.toPersistence(empleado).fechaEgreso).toEqual(fechaEgreso);
    });

    it('produces output that satisfies the persistence schema', () => {
      const empleado = mapper.toDomain(validPersistence);
      const out = mapper.toPersistence(empleado);
      expect(() => empleadoPersistenceSchema.parse(out)).not.toThrow();
    });
  });

  describe('round-trip', () => {
    it('toDomain -> toPersistence is the identity for valid input', () => {
      const empleado = mapper.toDomain(validPersistence);
      expect(mapper.toPersistence(empleado)).toEqual(validPersistence);
    });
  });

  describe('fromSchema', () => {
    const schemaEntity = {
      id: validId,
      cliente: { id: clienteId },
      estudio: { id: estudioId },
      nombre: 'Juan',
      apellido: 'Pérez',
      cuil: '20-12345678-6',
      fechaIngreso,
      fechaEgreso: undefined,
      sueldoBasico: 250000,
      categoriaConvenio: 'Auxiliar',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as EmpleadoEntity;

    it('flattens populated FK references into ids', () => {
      expect(mapper.fromSchema(schemaEntity)).toEqual(validPersistence);
    });

    it('preserves fechaEgreso when present', () => {
      const fechaEgreso = new Date('2024-06-30');
      const withEgreso = { ...schemaEntity, fechaEgreso } as EmpleadoEntity;
      expect(mapper.fromSchema(withEgreso).fechaEgreso).toEqual(fechaEgreso);
    });

    it('output of fromSchema is consumable by toDomain', () => {
      const empleado = mapper.toDomain(mapper.fromSchema(schemaEntity));
      expect(empleado.id).toBe(validId);
      expect(empleado.clienteId).toBe(clienteId);
      expect(empleado.estudioId).toBe(estudioId);
    });
  });
});
