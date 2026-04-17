import { z } from 'zod';
import { ROL } from '@numerito/shared';
import type { Rol } from '@numerito/shared';
import type { Mapper } from '../../../shared/domain';
import { Usuario, type AuthProvider } from '../../domain/entities/usuario.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { Password } from '../../domain/value-objects/password.vo';
import type { UsuarioEntity } from './usuario.schema';

const rolValues = Object.values(ROL) as [Rol, ...Rol[]];

export const usuarioPersistenceSchema = z.object({
  id: z.string().uuid(),
  email: z.string().min(1),
  passwordHash: z.string().min(1),
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  rol: z.enum(rolValues),
  isActive: z.boolean(),
  emailVerified: z.boolean(),
  provider: z.union([z.literal('google'), z.literal('microsoft'), z.null()]),
  providerId: z.string().nullable(),
  themePreference: z.union([z.literal('light'), z.literal('dark')]),
  avatarUrl: z.string().nullable(),
});

export type UsuarioPersistence = z.infer<typeof usuarioPersistenceSchema>;

export class UsuarioMapper implements Mapper<Usuario, UsuarioPersistence> {
  toDomain(persistence: UsuarioPersistence): Usuario {
    const data = usuarioPersistenceSchema.parse(persistence);
    return Usuario.reconstitute(
      {
        email: Email.create(data.email),
        password: Password.fromHash(data.passwordHash),
        nombre: data.nombre,
        apellido: data.apellido,
        rol: data.rol,
        isActive: data.isActive,
        emailVerified: data.emailVerified,
        provider: data.provider as AuthProvider,
        providerId: data.providerId,
        themePreference: data.themePreference,
        avatarUrl: data.avatarUrl,
      },
      data.id,
    );
  }

  toPersistence(domain: Usuario): UsuarioPersistence {
    return {
      id: domain.id,
      email: domain.email.value,
      passwordHash: domain.password.hashedValue,
      nombre: domain.nombre,
      apellido: domain.apellido,
      rol: domain.rol,
      isActive: domain.isActive,
      emailVerified: domain.emailVerified,
      provider: domain.provider,
      providerId: domain.providerId,
      themePreference: domain.themePreference,
      avatarUrl: domain.avatarUrl,
    };
  }

  fromSchema(entity: UsuarioEntity): UsuarioPersistence {
    return {
      id: entity.id,
      email: entity.email,
      passwordHash: entity.passwordHash,
      nombre: entity.nombre,
      apellido: entity.apellido,
      rol: entity.rol.codigo as Rol,
      isActive: entity.isActive,
      emailVerified: entity.emailVerified,
      provider: entity.provider as AuthProvider,
      providerId: entity.providerId,
      themePreference: (entity.themePreference as 'light' | 'dark') ?? 'light',
      avatarUrl: entity.avatarUrl,
    };
  }
}
