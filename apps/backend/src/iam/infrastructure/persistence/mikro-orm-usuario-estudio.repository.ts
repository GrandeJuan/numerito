import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { UsuarioEstudioRepository } from '../../domain/repositories/usuario-estudio.repository';
import { UsuarioEstudio } from '../../domain/entities/usuario-estudio.entity';
import { TenantAwareRepository } from '../../../shared/domain';
import {
  RequestContextService,
  REQUEST_CONTEXT,
} from '../../../shared/infrastructure/services/request-context.service';
import { UsuarioEstudioEntity } from './usuario-estudio.schema';
import { UsuarioEntity } from './usuario.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';
import { RolEntity } from '../../../shared/infrastructure/persistence/rol.schema';
import type { Rol } from '@numerito/shared';

@Injectable()
export class MikroOrmUsuarioEstudioRepository
  extends TenantAwareRepository<UsuarioEstudio>
  implements UsuarioEstudioRepository
{
  constructor(
    @Inject(REQUEST_CONTEXT) context: RequestContextService,
    private readonly em: EntityManager,
  ) {
    super(context);
  }

  async findById(id: string): Promise<UsuarioEstudio | null> {
    const tenantId = this.getTenantId();
    const entity = await this.em.findOne(
      UsuarioEstudioEntity,
      { id, estudio: { id: tenantId } },
      { populate: ['rol', 'usuario', 'estudio'] },
    );
    return entity ? this.toDomain(entity) : null;
  }

  async findByUsuarioId(usuarioId: string): Promise<UsuarioEstudio[]> {
    // Intentionally tenant-unscoped: this endpoint discovers which estudios
    // the user belongs to, which is needed BEFORE a tenant context exists.
    const entities = await this.em.find(
      UsuarioEstudioEntity,
      { usuario: { id: usuarioId } },
      { populate: ['rol', 'usuario', 'estudio'] },
    );
    return entities.map((e) => this.toDomain(e));
  }

  async findByUsuarioAndEstudio(usuarioId: string): Promise<UsuarioEstudio | null> {
    const tenantId = this.getTenantId();
    const entity = await this.em.findOne(
      UsuarioEstudioEntity,
      { usuario: { id: usuarioId }, estudio: { id: tenantId } },
      { populate: ['rol', 'usuario', 'estudio'] },
    );
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<UsuarioEstudio[]> {
    const tenantId = this.getTenantId();
    const entities = await this.em.find(
      UsuarioEstudioEntity,
      { estudio: { id: tenantId } },
      { populate: ['rol', 'usuario', 'estudio'] },
    );
    return entities.map((e) => this.toDomain(e));
  }

  async save(membership: UsuarioEstudio): Promise<void> {
    const tenantId = this.getTenantId();
    const existing = await this.em.findOne(UsuarioEstudioEntity, {
      id: membership.id,
      estudio: { id: tenantId },
    });
    if (existing) {
      const rolEntity = await this.em.findOneOrFail(RolEntity, { codigo: membership.rol });
      existing.rol = rolEntity;
      existing.isActive = membership.isActive;
    } else {
      const usuario = await this.em.findOneOrFail(UsuarioEntity, { id: membership.usuarioId });
      const estudio = await this.em.findOneOrFail(EstudioEntity, { id: membership.estudioId });
      const rolEntity = await this.em.findOneOrFail(RolEntity, { codigo: membership.rol });
      this.em.create(UsuarioEstudioEntity, {
        id: membership.id,
        usuario,
        estudio,
        rol: rolEntity,
        isActive: membership.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await this.em.flush();
  }

  async delete(membership: UsuarioEstudio): Promise<void> {
    const tenantId = this.getTenantId();
    const entity = await this.em.findOne(UsuarioEstudioEntity, {
      id: membership.id,
      estudio: { id: tenantId },
    });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }

  private toDomain(entity: UsuarioEstudioEntity): UsuarioEstudio {
    return UsuarioEstudio.reconstitute(
      {
        usuarioId: entity.usuario.id,
        estudioId: entity.estudio.id,
        rol: entity.rol.codigo as Rol,
        isActive: entity.isActive,
      },
      entity.id,
    );
  }
}
