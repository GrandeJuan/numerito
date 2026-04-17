import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { UsuarioEstudioRepository } from '../../domain/repositories/usuario-estudio.repository';
import type { UsuarioEstudio } from '../../domain/entities/usuario-estudio.entity';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import { TenantAwareRepository } from '../../../shared/domain';
import {
  RequestContextService,
  REQUEST_CONTEXT,
} from '../../../shared/infrastructure/services/request-context.service';
import { UsuarioEstudioEntity } from './usuario-estudio.schema';
import { UsuarioEstudioMapper } from './usuario-estudio.mapper';
import { UsuarioEntity } from './usuario.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';
import { RolEntity } from '../../../shared/infrastructure/persistence/rol.schema';

@Injectable()
export class MikroOrmUsuarioEstudioRepository
  extends TenantAwareRepository<UsuarioEstudio>
  implements UsuarioEstudioRepository
{
  private readonly mapper = new UsuarioEstudioMapper();

  constructor(
    @Inject(REQUEST_CONTEXT) context: RequestContextService,
    private readonly em: EntityManager,
  ) {
    super(context);
  }

  async findById(principal: EstudioPrincipal, id: string): Promise<UsuarioEstudio | null> {
    const entity = await this.em.findOne(
      UsuarioEstudioEntity,
      { id, estudio: { id: principal.estudioId } },
      { populate: ['rol', 'usuario', 'estudio'] },
    );
    return entity ? this.mapper.toDomain(this.mapper.fromSchema(entity)) : null;
  }

  /**
   * Intentionally cross-tenant: discovers which estudios a user belongs to.
   * Called before a tenant context exists (e.g., estudio picker after login).
   * GlobalRepository escape — documented per ADR.
   */
  async findByUsuarioId(usuarioId: string): Promise<UsuarioEstudio[]> {
    const entities = await this.em.find(
      UsuarioEstudioEntity,
      { usuario: { id: usuarioId } },
      { populate: ['rol', 'usuario', 'estudio'] },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findByUsuarioAndEstudio(principal: EstudioPrincipal, usuarioId: string): Promise<UsuarioEstudio | null> {
    const entity = await this.em.findOne(
      UsuarioEstudioEntity,
      { usuario: { id: usuarioId }, estudio: { id: principal.estudioId } },
      { populate: ['rol', 'usuario', 'estudio'] },
    );
    return entity ? this.mapper.toDomain(this.mapper.fromSchema(entity)) : null;
  }

  async findAll(principal: EstudioPrincipal): Promise<UsuarioEstudio[]> {
    const entities = await this.em.find(
      UsuarioEstudioEntity,
      { estudio: { id: principal.estudioId } },
      { populate: ['rol', 'usuario', 'estudio'] },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async save(principal: EstudioPrincipal, membership: UsuarioEstudio): Promise<void> {
    const existing = await this.em.findOne(UsuarioEstudioEntity, {
      id: membership.id,
      estudio: { id: principal.estudioId },
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

  async delete(principal: EstudioPrincipal, membership: UsuarioEstudio): Promise<void> {
    const entity = await this.em.findOne(UsuarioEstudioEntity, {
      id: membership.id,
      estudio: { id: principal.estudioId },
    });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }
}
