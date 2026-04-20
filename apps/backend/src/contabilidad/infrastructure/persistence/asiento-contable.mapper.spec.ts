import { AsientoContable } from '../../domain/entities/asiento-contable.entity';
import {
  AsientoContableMapper,
  asientoContablePersistenceSchema,
  type AsientoContablePersistence,
} from './asiento-contable.mapper';
import type { AsientoContableEntity } from './asiento-contable.schema';

describe('AsientoContableMapper', () => {
  const mapper = new AsientoContableMapper();
  const validId = '11111111-1111-1111-1111-111111111111';
  const libroId = '22222222-2222-2222-2222-222222222222';
  const clienteId = '33333333-3333-3333-3333-333333333333';
  const estudioId = '44444444-4444-4444-4444-444444444444';
  const fecha = new Date('2026-03-31T00:00:00.000Z');

  const validPersistence: AsientoContablePersistence = {
    id: validId,
    libroId,
    clienteId,
    estudioId,
    fecha,
    descripcion: 'Venta de servicios',
    lineas: [
      { cuentaId: 'cuenta-1', debe: 10000, haber: 0, descripcion: 'Deudores' },
      { cuentaId: 'cuenta-2', debe: 0, haber: 10000, descripcion: 'Ventas' },
    ],
  };

  describe('toDomain', () => {
    it('reconstitutes an AsientoContable preserving all fields', () => {
      const asiento = mapper.toDomain(validPersistence);

      expect(asiento).toBeInstanceOf(AsientoContable);
      expect(asiento.id).toBe(validId);
      expect(asiento.libroId).toBe(libroId);
      expect(asiento.clienteId).toBe(clienteId);
      expect(asiento.estudioId).toBe(estudioId);
      expect(asiento.fecha).toBe(fecha);
      expect(asiento.descripcion).toBe('Venta de servicios');
      expect(asiento.lineas).toEqual(validPersistence.lineas);
    });

    it('does not emit domain events on reconstitution', () => {
      const asiento = mapper.toDomain(validPersistence);
      expect(asiento.getDomainEvents()).toHaveLength(0);
    });

    it('bypasses creation invariants (unbalanced lines allowed from DB)', () => {
      const unbalanced: AsientoContablePersistence = {
        ...validPersistence,
        lineas: [
          { cuentaId: 'c1', debe: 10000, haber: 0, descripcion: 'D' },
          { cuentaId: 'c2', debe: 0, haber: 5000, descripcion: 'H' },
        ],
      };
      expect(() => mapper.toDomain(unbalanced)).not.toThrow();
    });

    it('rejects malformed persistence id (Zod validation)', () => {
      expect(() => mapper.toDomain({ ...validPersistence, id: '' })).toThrow();
    });

    it('rejects missing required fields (Zod validation)', () => {
      const bad = { ...validPersistence } as Partial<AsientoContablePersistence>;
      delete bad.libroId;
      expect(() => mapper.toDomain(bad as AsientoContablePersistence)).toThrow();
    });

    it('rejects empty libroId (Zod validation)', () => {
      expect(() => mapper.toDomain({ ...validPersistence, libroId: '' })).toThrow();
    });

    it('rejects malformed linea (missing cuentaId)', () => {
      const bad = {
        ...validPersistence,
        lineas: [
          { debe: 100, haber: 0, descripcion: 'D' },
        ] as unknown as AsientoContablePersistence['lineas'],
      };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects wrong types (Zod validation)', () => {
      const bad = {
        ...validPersistence,
        fecha: '2026-03-31' as unknown as Date,
      };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects non-numeric debe/haber', () => {
      const bad = {
        ...validPersistence,
        lineas: [
          { cuentaId: 'c1', debe: '10000' as unknown as number, haber: 0, descripcion: 'D' },
          { cuentaId: 'c2', debe: 0, haber: 10000, descripcion: 'H' },
        ],
      };
      expect(() => mapper.toDomain(bad)).toThrow();
    });
  });

  describe('toPersistence', () => {
    it('extracts the flat persistence shape from a domain AsientoContable', () => {
      const asiento = AsientoContable.reconstitute(
        {
          libroId,
          clienteId,
          estudioId,
          fecha,
          descripcion: 'Venta de servicios',
          lineas: [
            { cuentaId: 'cuenta-1', debe: 10000, haber: 0, descripcion: 'Deudores' },
            { cuentaId: 'cuenta-2', debe: 0, haber: 10000, descripcion: 'Ventas' },
          ],
        },
        validId,
      );

      expect(mapper.toPersistence(asiento)).toEqual(validPersistence);
    });

    it('produces output that satisfies the persistence schema', () => {
      const asiento = mapper.toDomain(validPersistence);
      const out = mapper.toPersistence(asiento);
      expect(() => asientoContablePersistenceSchema.parse(out)).not.toThrow();
    });

    it('preserves linea order and count', () => {
      const multi: AsientoContablePersistence = {
        ...validPersistence,
        lineas: [
          { cuentaId: 'c1', debe: 5000, haber: 0, descripcion: 'D1' },
          { cuentaId: 'c2', debe: 3000, haber: 0, descripcion: 'D2' },
          { cuentaId: 'c3', debe: 0, haber: 8000, descripcion: 'H1' },
        ],
      };
      const asiento = mapper.toDomain(multi);
      const out = mapper.toPersistence(asiento);
      expect(out.lineas).toEqual(multi.lineas);
    });
  });

  describe('round-trip', () => {
    it('toDomain -> toPersistence is the identity for valid input', () => {
      const asiento = mapper.toDomain(validPersistence);
      expect(mapper.toPersistence(asiento)).toEqual(validPersistence);
    });
  });

  describe('fromSchema', () => {
    const schemaEntity = {
      id: validId,
      libro: { id: libroId },
      cliente: { id: clienteId },
      estudio: { id: estudioId },
      fecha,
      descripcion: 'Venta de servicios',
      lineas: [
        { cuentaId: 'cuenta-1', debe: 10000, haber: 0, descripcion: 'Deudores' },
        { cuentaId: 'cuenta-2', debe: 0, haber: 10000, descripcion: 'Ventas' },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as AsientoContableEntity;

    it('flattens populated FK references into ids', () => {
      expect(mapper.fromSchema(schemaEntity)).toEqual(validPersistence);
    });

    it('output of fromSchema is consumable by toDomain', () => {
      const asiento = mapper.toDomain(mapper.fromSchema(schemaEntity));
      expect(asiento.id).toBe(validId);
      expect(asiento.libroId).toBe(libroId);
      expect(asiento.clienteId).toBe(clienteId);
      expect(asiento.estudioId).toBe(estudioId);
    });

    it('defaults lineas to [] when JSON column is null/undefined', () => {
      const entityWithoutLineas = {
        ...schemaEntity,
        lineas: undefined,
      } as unknown as AsientoContableEntity;
      const flat = mapper.fromSchema(entityWithoutLineas);
      expect(flat.lineas).toEqual([]);
    });
  });
});
