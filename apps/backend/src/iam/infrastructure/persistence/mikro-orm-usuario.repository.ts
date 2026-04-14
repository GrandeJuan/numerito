import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { GlobalRepository } from '../../../shared/domain';
import type { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { Usuario } from '../../domain/entities/usuario.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { Password } from '../../domain/value-objects/password.vo';
import { UsuarioEntity } from './usuario.schema';
import { RolEntity } from '../../../shared/infrastructure/persistence/rol.schema';
import type { Rol } from '@numerito/shared';
import type { AuthProvider } from '../../domain/entities/usuario.entity';

@Injectable()
export class MikroOrmUsuarioRepository
  extends GlobalRepository<Usuario>
  implements UsuarioRepository
{
  constructor(private readonly em: EntityManager) {
    super();
  }

  async findById(id: string): Promise<Usuario | null> {
    const entity = await this.em.findOne(UsuarioEntity, { id }, { populate: ['rol'] });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByEmail(email: Email): Promise<Usuario | null> {
    const entity = await this.em.findOne(
      UsuarioEntity,
      { email: email.value },
      { populate: ['rol'] },
    );
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findAll(): Promise<Usuario[]> {
    const entities = await this.em.findAll(UsuarioEntity, { populate: ['rol'] });
    return entities.map((e) => this.toDomain(e));
  }

  async save(usuario: Usuario): Promise<void> {
    const rol = await this.em.findOneOrFail(RolEntity, { codigo: usuario.rol });
    const existing = await this.em.findOne(UsuarioEntity, { id: usuario.id });
    if (existing) {
      existing.email = usuario.email.value;
      existing.passwordHash = usuario.password.hashedValue;
      existing.nombre = usuario.nombre;
      existing.apellido = usuario.apellido;
      existing.rol = rol;
      existing.isActive = usuario.isActive;
      existing.emailVerified = usuario.emailVerified;
      existing.provider = usuario.provider;
      existing.providerId = usuario.providerId;
      existing.themePreference = usuario.themePreference;
      existing.avatarUrl = usuario.avatarUrl;
    } else {
      this.em.create(UsuarioEntity, {
        id: usuario.id,
        email: usuario.email.value,
        passwordHash: usuario.password.hashedValue,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol,
        isActive: usuario.isActive,
        emailVerified: usuario.emailVerified,
        provider: usuario.provider,
        providerId: usuario.providerId,
        themePreference: usuario.themePreference,
        avatarUrl: usuario.avatarUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await this.em.flush();
  }

  async delete(usuario: Usuario): Promise<void> {
    const entity = await this.em.findOne(UsuarioEntity, { id: usuario.id });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }

  private toDomain(entity: UsuarioEntity): Usuario {
    return Usuario.reconstitute(
      {
        email: Email.create(entity.email),
        password: Password.fromHash(entity.passwordHash),
        nombre: entity.nombre,
        apellido: entity.apellido,
        rol: entity.rol.codigo as Rol,
        isActive: entity.isActive,
        emailVerified: entity.emailVerified,
        provider: entity.provider as AuthProvider,
        providerId: entity.providerId,
        themePreference: (entity.themePreference as 'light' | 'dark') ?? 'light',
        avatarUrl: entity.avatarUrl,
      },
      entity.id,
    );
  }
}
