import { Pago } from '../../domain/entities/pago.entity';
import {
  PagoMapper,
  pagoPersistenceSchema,
  type PagoPersistence,
} from './pago.mapper';
import type { PagoEntity } from './pago.schema';

describe('PagoMapper', () => {
  const mapper = new PagoMapper();
  const validId = '11111111-1111-1111-1111-111111111111';
  const facturaId = 'factura-1';
  const estudioId = 'estudio-1';
  const fecha = new Date('2026-02-10');

  const validPersistence: PagoPersistence = {
    id: validId,
    facturaId,
    estudioId,
    fecha,
    monto: 6050,
    medioPagoId: 1,
    referencia: 'TRF-123456',
  };

  describe('toDomain', () => {
    it('reconstitutes a Pago preserving all fields', () => {
      const pago = mapper.toDomain(validPersistence);

      expect(pago).toBeInstanceOf(Pago);
      expect(pago.id).toBe(validId);
      expect(pago.facturaId).toBe(facturaId);
      expect(pago.estudioId).toBe(estudioId);
      expect(pago.fecha).toEqual(fecha);
      expect(pago.monto).toBe(6050);
      expect(pago.medioPagoId).toBe(1);
      expect(pago.referencia).toBe('TRF-123456');
    });

    it('omits referencia when not present', () => {
      const { referencia: _ignored, ...rest } = validPersistence;
      const pago = mapper.toDomain(rest as PagoPersistence);
      expect(pago.referencia).toBeUndefined();
    });

    it('does not emit domain events on reconstitution', () => {
      const pago = mapper.toDomain(validPersistence);
      expect(pago.getDomainEvents()).toHaveLength(0);
    });

    it('rejects malformed persistence id (Zod validation)', () => {
      const bad = { ...validPersistence, id: 'not-a-uuid' };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects missing required fields (Zod validation)', () => {
      const bad = { ...validPersistence } as Partial<PagoPersistence>;
      delete bad.facturaId;
      expect(() => mapper.toDomain(bad as PagoPersistence)).toThrow();
    });

    it('rejects wrong types (Zod validation)', () => {
      const bad = {
        ...validPersistence,
        monto: '6050' as unknown as number,
      };
      expect(() => mapper.toDomain(bad)).toThrow();
    });
  });

  describe('toPersistence', () => {
    it('extracts the flat persistence shape from a domain Pago', () => {
      const pago = mapper.toDomain(validPersistence);
      expect(mapper.toPersistence(pago)).toEqual(validPersistence);
    });

    it('omits referencia when absent on the domain entity', () => {
      const { referencia: _ignored, ...rest } = validPersistence;
      const pago = mapper.toDomain(rest as PagoPersistence);
      expect(mapper.toPersistence(pago).referencia).toBeUndefined();
    });

    it('produces output that satisfies the persistence schema', () => {
      const pago = mapper.toDomain(validPersistence);
      const out = mapper.toPersistence(pago);
      expect(() => pagoPersistenceSchema.parse(out)).not.toThrow();
    });
  });

  describe('round-trip', () => {
    it('toDomain -> toPersistence is the identity for valid input', () => {
      const pago = mapper.toDomain(validPersistence);
      expect(mapper.toPersistence(pago)).toEqual(validPersistence);
    });
  });

  describe('fromSchema', () => {
    const schemaEntity = {
      id: validId,
      factura: { id: facturaId },
      estudio: { id: estudioId },
      fecha,
      monto: 6050,
      medioPago: { id: 1 },
      referencia: 'TRF-123456',
      createdAt: new Date(),
    } as unknown as PagoEntity;

    it('flattens populated FK references into ids', () => {
      expect(mapper.fromSchema(schemaEntity)).toEqual(validPersistence);
    });

    it('preserves undefined referencia when absent', () => {
      const withoutReferencia = {
        ...schemaEntity,
        referencia: undefined,
      } as unknown as PagoEntity;
      expect(mapper.fromSchema(withoutReferencia).referencia).toBeUndefined();
    });

    it('output of fromSchema is consumable by toDomain', () => {
      const pago = mapper.toDomain(mapper.fromSchema(schemaEntity));
      expect(pago.id).toBe(validId);
      expect(pago.facturaId).toBe(facturaId);
      expect(pago.estudioId).toBe(estudioId);
      expect(pago.medioPagoId).toBe(1);
    });
  });
});
