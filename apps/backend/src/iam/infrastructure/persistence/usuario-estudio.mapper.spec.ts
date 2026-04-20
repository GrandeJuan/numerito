import { UsuarioEstudio } from '../../domain/entities/usuario-estudio.entity';
import {
  UsuarioEstudioMapper,
  usuarioEstudioPersistenceSchema,
  type UsuarioEstudioPersistence,
} from './usuario-estudio.mapper';
import type { UsuarioEstudioEntity } from './usuario-estudio.schema';

describe('UsuarioEstudioMapper', () => {
  const mapper = new UsuarioEstudioMapper();
  const validId = '11111111-1111-1111-1111-111111111111';
  const validUsuarioId = '22222222-2222-2222-2222-222222222222';
  const validEstudioId = '33333333-3333-3333-3333-333333333333';

  const validPersistence: UsuarioEstudioPersistence = {
    id: validId,
    usuarioId: validUsuarioId,
    estudioId: validEstudioId,
    rol: 'SOCIO',
    isActive: true,
  };

  describe('toDomain', () => {
    it('reconstitutes a UsuarioEstudio preserving all fields', () => {
      const ue = mapper.toDomain(validPersistence);

      expect(ue).toBeInstanceOf(UsuarioEstudio);
      expect(ue.id).toBe(validId);
      expect(ue.usuarioId).toBe(validUsuarioId);
      expect(ue.estudioId).toBe(validEstudioId);
      expect(ue.rol).toBe('SOCIO');
      expect(ue.isActive).toBe(true);
    });

    it('preserves inactive state', () => {
      const ue = mapper.toDomain({ ...validPersistence, isActive: false });
      expect(ue.isActive).toBe(false);
    });

    it('does not emit domain events on reconstitution', () => {
      const ue = mapper.toDomain(validPersistence);
      expect(ue.getDomainEvents()).toHaveLength(0);
    });

    it('rejects malformed persistence (Zod validation)', () => {
      const bad = { ...validPersistence, id: '' };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects invalid rol value (Zod validation)', () => {
      const bad = { ...validPersistence, rol: 'INEXISTENTE' as any };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects wrong types (Zod validation)', () => {
      const bad = { ...validPersistence, isActive: 'true' as unknown as boolean };
      expect(() => mapper.toDomain(bad)).toThrow();
    });
  });

  describe('toPersistence', () => {
    it('extracts the flat persistence shape from a domain UsuarioEstudio', () => {
      const ue = UsuarioEstudio.reconstitute(
        {
          usuarioId: validUsuarioId,
          estudioId: validEstudioId,
          rol: 'SOCIO',
          isActive: true,
        },
        validId,
      );

      expect(mapper.toPersistence(ue)).toEqual(validPersistence);
    });

    it('reflects mutations made via domain methods', () => {
      const ue = mapper.toDomain(validPersistence);
      ue.deactivate();

      expect(mapper.toPersistence(ue).isActive).toBe(false);
    });

    it('produces output that satisfies the persistence schema', () => {
      const ue = mapper.toDomain(validPersistence);
      const out = mapper.toPersistence(ue);
      expect(() => usuarioEstudioPersistenceSchema.parse(out)).not.toThrow();
    });
  });

  describe('round-trip', () => {
    it('toDomain -> toPersistence is the identity for valid input', () => {
      const ue = mapper.toDomain(validPersistence);
      expect(mapper.toPersistence(ue)).toEqual(validPersistence);
    });
  });

  describe('fromSchema', () => {
    it('flattens populated FK references into flat persistence shape', () => {
      const schemaEntity = {
        id: validId,
        usuario: { id: validUsuarioId },
        estudio: { id: validEstudioId },
        rol: { codigo: 'SOCIO' },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as UsuarioEstudioEntity;

      expect(mapper.fromSchema(schemaEntity)).toEqual(validPersistence);
    });

    it('output of fromSchema is consumable by toDomain', () => {
      const schemaEntity = {
        id: validId,
        usuario: { id: validUsuarioId },
        estudio: { id: validEstudioId },
        rol: { codigo: 'SOCIO' },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as UsuarioEstudioEntity;

      const ue = mapper.toDomain(mapper.fromSchema(schemaEntity));
      expect(ue.id).toBe(validId);
      expect(ue.usuarioId).toBe(validUsuarioId);
      expect(ue.estudioId).toBe(validEstudioId);
    });
  });
});
