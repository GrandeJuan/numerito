import { Usuario } from '../../domain/entities/usuario.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { Password } from '../../domain/value-objects/password.vo';
import { UsuarioMapper, usuarioPersistenceSchema, type UsuarioPersistence } from './usuario.mapper';
import type { UsuarioEntity } from './usuario.schema';

describe('UsuarioMapper', () => {
  const mapper = new UsuarioMapper();
  const validId = '11111111-1111-1111-1111-111111111111';

  const validPersistence: UsuarioPersistence = {
    id: validId,
    email: 'usuario@test.com',
    passwordHash: '$2b$10$hashedpasswordvalue1234567890abc',
    nombre: 'Juan',
    apellido: 'Perez',
    rol: 'SOCIO',
    isActive: true,
    emailVerified: false,
    provider: null,
    providerId: null,
    themePreference: 'light',
    avatarUrl: null,
  };

  describe('toDomain', () => {
    it('reconstitutes a Usuario preserving all fields', () => {
      const usuario = mapper.toDomain(validPersistence);

      expect(usuario).toBeInstanceOf(Usuario);
      expect(usuario.id).toBe(validId);
      expect(usuario.email.value).toBe('usuario@test.com');
      expect(usuario.password.hashedValue).toBe('$2b$10$hashedpasswordvalue1234567890abc');
      expect(usuario.nombre).toBe('Juan');
      expect(usuario.apellido).toBe('Perez');
      expect(usuario.rol).toBe('SOCIO');
      expect(usuario.isActive).toBe(true);
      expect(usuario.emailVerified).toBe(false);
      expect(usuario.provider).toBeNull();
      expect(usuario.providerId).toBeNull();
      expect(usuario.themePreference).toBe('light');
      expect(usuario.avatarUrl).toBeNull();
    });

    it('preserves SSO provider fields', () => {
      const usuario = mapper.toDomain({
        ...validPersistence,
        provider: 'google',
        providerId: 'google-id-123',
        emailVerified: true,
      });
      expect(usuario.provider).toBe('google');
      expect(usuario.providerId).toBe('google-id-123');
      expect(usuario.emailVerified).toBe(true);
    });

    it('preserves dark theme preference', () => {
      const usuario = mapper.toDomain({ ...validPersistence, themePreference: 'dark' });
      expect(usuario.themePreference).toBe('dark');
    });

    it('preserves avatar URL', () => {
      const usuario = mapper.toDomain({ ...validPersistence, avatarUrl: 'https://example.com/avatar.png' });
      expect(usuario.avatarUrl).toBe('https://example.com/avatar.png');
    });

    it('does not emit domain events on reconstitution', () => {
      const usuario = mapper.toDomain(validPersistence);
      expect(usuario.getDomainEvents()).toHaveLength(0);
    });

    it('rejects malformed persistence (Zod validation)', () => {
      const bad = { ...validPersistence, id: 'not-a-uuid' };
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
    it('extracts the flat persistence shape from a domain Usuario', () => {
      const usuario = Usuario.reconstitute(
        {
          email: Email.create('usuario@test.com'),
          password: Password.fromHash('$2b$10$hashedpasswordvalue1234567890abc'),
          nombre: 'Juan',
          apellido: 'Perez',
          rol: 'SOCIO',
          isActive: true,
          emailVerified: false,
          provider: null,
          providerId: null,
          themePreference: 'light',
          avatarUrl: null,
        },
        validId,
      );

      expect(mapper.toPersistence(usuario)).toEqual(validPersistence);
    });

    it('reflects mutations made via domain methods', () => {
      const usuario = mapper.toDomain(validPersistence);
      usuario.deactivate();

      expect(mapper.toPersistence(usuario).isActive).toBe(false);
    });

    it('produces output that satisfies the persistence schema', () => {
      const usuario = mapper.toDomain(validPersistence);
      const out = mapper.toPersistence(usuario);
      expect(() => usuarioPersistenceSchema.parse(out)).not.toThrow();
    });
  });

  describe('round-trip', () => {
    it('toDomain -> toPersistence is the identity for valid input', () => {
      const usuario = mapper.toDomain(validPersistence);
      expect(mapper.toPersistence(usuario)).toEqual(validPersistence);
    });
  });

  describe('fromSchema', () => {
    it('flattens populated FK references into flat persistence shape', () => {
      const schemaEntity = {
        id: validId,
        email: 'usuario@test.com',
        passwordHash: '$2b$10$hashedpasswordvalue1234567890abc',
        nombre: 'Juan',
        apellido: 'Perez',
        rol: { codigo: 'SOCIO' },
        isActive: true,
        emailVerified: false,
        provider: null,
        providerId: null,
        themePreference: 'light',
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as UsuarioEntity;

      expect(mapper.fromSchema(schemaEntity)).toEqual(validPersistence);
    });

    it('output of fromSchema is consumable by toDomain', () => {
      const schemaEntity = {
        id: validId,
        email: 'usuario@test.com',
        passwordHash: '$2b$10$hashedpasswordvalue1234567890abc',
        nombre: 'Juan',
        apellido: 'Perez',
        rol: { codigo: 'SOCIO' },
        isActive: true,
        emailVerified: false,
        provider: null,
        providerId: null,
        themePreference: 'light',
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as UsuarioEntity;

      const usuario = mapper.toDomain(mapper.fromSchema(schemaEntity));
      expect(usuario.id).toBe(validId);
      expect(usuario.email.value).toBe('usuario@test.com');
    });
  });
});
