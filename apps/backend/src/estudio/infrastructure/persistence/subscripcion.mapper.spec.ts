import {
  Subscripcion,
  EstadoSubscripcion,
  CicloFacturacion,
} from '../../domain/entities/subscripcion.entity';
import {
  SubscripcionMapper,
  subscripcionPersistenceSchema,
  type SubscripcionPersistence,
} from './subscripcion.mapper';
import type { SubscripcionEntity } from './subscripcion.schema';

describe('SubscripcionMapper', () => {
  const mapper = new SubscripcionMapper();
  const validId = '11111111-1111-1111-1111-111111111111';
  const estudioId = '22222222-2222-2222-2222-222222222222';
  const fechaInicio = new Date('2026-01-01T00:00:00.000Z');
  const fechaFin = new Date('2027-01-01T00:00:00.000Z');

  const validPersistence: SubscripcionPersistence = {
    id: validId,
    estudioId,
    planId: '1',
    fechaInicio,
    fechaFin,
    estado: EstadoSubscripcion.ACTIVA,
    cicloFacturacion: CicloFacturacion.MENSUAL,
    autoRenovacion: true,
  };

  describe('toDomain', () => {
    it('reconstitutes a Subscripcion preserving all fields', () => {
      const sub = mapper.toDomain(validPersistence);

      expect(sub).toBeInstanceOf(Subscripcion);
      expect(sub.id).toBe(validId);
      expect(sub.estudioId).toBe(estudioId);
      expect(sub.planId).toBe('1');
      expect(sub.fechaInicio).toBe(fechaInicio);
      expect(sub.fechaFin).toBe(fechaFin);
      expect(sub.estado).toBe(EstadoSubscripcion.ACTIVA);
      expect(sub.cicloFacturacion).toBe(CicloFacturacion.MENSUAL);
      expect(sub.autoRenovacion).toBe(true);
    });

    it('preserves TRIAL estado', () => {
      const sub = mapper.toDomain({ ...validPersistence, estado: EstadoSubscripcion.TRIAL });
      expect(sub.estado).toBe(EstadoSubscripcion.TRIAL);
    });

    it('does not emit domain events on reconstitution', () => {
      const sub = mapper.toDomain(validPersistence);
      expect(sub.getDomainEvents()).toHaveLength(0);
    });

    it('rejects malformed persistence (Zod validation)', () => {
      const bad = { ...validPersistence, id: '' };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects invalid estado value (Zod validation)', () => {
      const bad = { ...validPersistence, estado: 'INEXISTENTE' as EstadoSubscripcion };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects wrong types (Zod validation)', () => {
      const bad = { ...validPersistence, autoRenovacion: 'true' as unknown as boolean };
      expect(() => mapper.toDomain(bad)).toThrow();
    });
  });

  describe('toPersistence', () => {
    it('extracts the flat persistence shape from a domain Subscripcion', () => {
      const sub = Subscripcion.reconstitute(
        {
          estudioId,
          planId: '1',
          fechaInicio,
          fechaFin,
          estado: EstadoSubscripcion.ACTIVA,
          cicloFacturacion: CicloFacturacion.MENSUAL,
          autoRenovacion: true,
        },
        validId,
      );

      expect(mapper.toPersistence(sub)).toEqual(validPersistence);
    });

    it('reflects mutations made via domain methods', () => {
      const sub = Subscripcion.reconstitute({ ...validPersistence }, validId);
      sub.cancelar();

      expect(mapper.toPersistence(sub).estado).toBe(EstadoSubscripcion.CANCELADA);
    });

    it('produces output that satisfies the persistence schema', () => {
      const sub = mapper.toDomain(validPersistence);
      const out = mapper.toPersistence(sub);
      expect(() => subscripcionPersistenceSchema.parse(out)).not.toThrow();
    });
  });

  describe('round-trip', () => {
    it('toDomain -> toPersistence is the identity for valid input', () => {
      const sub = mapper.toDomain(validPersistence);
      expect(mapper.toPersistence(sub)).toEqual(validPersistence);
    });
  });

  describe('fromSchema', () => {
    it('flattens populated FK references into flat persistence shape', () => {
      const schemaEntity = {
        id: validId,
        estudio: { id: estudioId },
        plan: { id: 1 },
        estadoSubscripcion: { codigo: 'ACTIVA' },
        cicloFacturacion: { codigo: 'MENSUAL' },
        fechaInicio,
        fechaFin,
        autoRenovacion: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as SubscripcionEntity;

      expect(mapper.fromSchema(schemaEntity)).toEqual(validPersistence);
    });

    it('output of fromSchema is consumable by toDomain', () => {
      const schemaEntity = {
        id: validId,
        estudio: { id: estudioId },
        plan: { id: 1 },
        estadoSubscripcion: { codigo: 'ACTIVA' },
        cicloFacturacion: { codigo: 'MENSUAL' },
        fechaInicio,
        fechaFin,
        autoRenovacion: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as SubscripcionEntity;

      const sub = mapper.toDomain(mapper.fromSchema(schemaEntity));
      expect(sub.id).toBe(validId);
      expect(sub.estudioId).toBe(estudioId);
    });
  });
});
