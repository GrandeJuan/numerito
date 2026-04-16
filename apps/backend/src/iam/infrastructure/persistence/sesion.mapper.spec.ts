import { Sesion } from '../../domain/entities/sesion.entity';
import { SesionMapper, sesionPersistenceSchema, type SesionPersistence } from './sesion.mapper';
import type { SesionEntity } from './sesion.schema';

describe('SesionMapper', () => {
  const mapper = new SesionMapper();
  const validId = '11111111-1111-1111-1111-111111111111';
  const validUserId = '22222222-2222-2222-2222-222222222222';
  const expiresAt = new Date('2027-01-01T00:00:00.000Z');

  const validPersistence: SesionPersistence = {
    id: validId,
    usuarioId: validUserId,
    refreshToken: 'token-abc',
    ipAddress: '10.0.0.1',
    userAgent: 'Chrome/120',
    expiresAt,
    isActive: true,
  };

  describe('toDomain', () => {
    it('reconstitutes a Sesion preserving all fields', () => {
      const sesion = mapper.toDomain(validPersistence);

      expect(sesion).toBeInstanceOf(Sesion);
      expect(sesion.id).toBe(validId);
      expect(sesion.usuarioId).toBe(validUserId);
      expect(sesion.refreshToken).toBe('token-abc');
      expect(sesion.ipAddress).toBe('10.0.0.1');
      expect(sesion.userAgent).toBe('Chrome/120');
      expect(sesion.expiresAt).toBe(expiresAt);
      expect(sesion.isActive).toBe(true);
    });

    it('preserves inactive state', () => {
      const sesion = mapper.toDomain({ ...validPersistence, isActive: false });
      expect(sesion.isActive).toBe(false);
    });

    it('does not emit domain events on reconstitution', () => {
      const sesion = mapper.toDomain(validPersistence);
      expect(sesion.getDomainEvents()).toHaveLength(0);
    });

    it('rejects malformed persistence (Zod validation)', () => {
      const bad = { ...validPersistence, id: 'not-a-uuid' };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects missing required fields (Zod validation)', () => {
      const bad = { ...validPersistence } as Partial<SesionPersistence>;
      delete bad.refreshToken;
      expect(() => mapper.toDomain(bad as SesionPersistence)).toThrow();
    });

    it('rejects empty refreshToken (Zod validation)', () => {
      expect(() => mapper.toDomain({ ...validPersistence, refreshToken: '' })).toThrow();
    });

    it('rejects wrong types (Zod validation)', () => {
      const bad = { ...validPersistence, isActive: 'true' as unknown as boolean };
      expect(() => mapper.toDomain(bad)).toThrow();
    });
  });

  describe('toPersistence', () => {
    it('extracts the flat persistence shape from a domain Sesion', () => {
      const sesion = Sesion.reconstitute(
        {
          usuarioId: validUserId,
          refreshToken: 'token-abc',
          ipAddress: '10.0.0.1',
          userAgent: 'Chrome/120',
          expiresAt,
          isActive: true,
        },
        validId,
      );

      expect(mapper.toPersistence(sesion)).toEqual(validPersistence);
    });

    it('reflects mutations made via domain methods', () => {
      const sesion = Sesion.reconstitute(
        { ...validPersistence },
        validId,
      );
      sesion.revoke();

      expect(mapper.toPersistence(sesion).isActive).toBe(false);
    });

    it('produces output that satisfies the persistence schema', () => {
      const sesion = mapper.toDomain(validPersistence);
      const out = mapper.toPersistence(sesion);
      expect(() => sesionPersistenceSchema.parse(out)).not.toThrow();
    });
  });

  describe('round-trip', () => {
    it('toDomain -> toPersistence is the identity for valid input', () => {
      const sesion = mapper.toDomain(validPersistence);
      expect(mapper.toPersistence(sesion)).toEqual(validPersistence);
    });
  });

  describe('fromSchema', () => {
    it('flattens populated FK reference (usuario.id) into usuarioId', () => {
      const schemaEntity = {
        id: validId,
        usuario: { id: validUserId },
        refreshToken: 'token-abc',
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome/120',
        expiresAt,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as SesionEntity;

      expect(mapper.fromSchema(schemaEntity)).toEqual(validPersistence);
    });

    it('output of fromSchema is consumable by toDomain', () => {
      const schemaEntity = {
        id: validId,
        usuario: { id: validUserId },
        refreshToken: 'token-abc',
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome/120',
        expiresAt,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as SesionEntity;

      const sesion = mapper.toDomain(mapper.fromSchema(schemaEntity));
      expect(sesion.id).toBe(validId);
      expect(sesion.usuarioId).toBe(validUserId);
    });
  });
});
