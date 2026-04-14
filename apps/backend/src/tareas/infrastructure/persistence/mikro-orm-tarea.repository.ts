import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { TareaRepository } from '../../domain/repositories/tarea.repository';
import { Tarea, type Prioridad } from '../../domain/entities/tarea.entity';
import { TenantAwareRepository } from '../../../shared/domain';
import {
  RequestContextService,
  REQUEST_CONTEXT,
} from '../../../shared/infrastructure/services/request-context.service';
import { TareaEntity } from './tarea.schema';
import { EstadoTareaEntity } from '../../../shared/infrastructure/persistence/estado-tarea.schema';
import { PrioridadEntity } from '../../../shared/infrastructure/persistence/prioridad.schema';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';
import { UsuarioEntity } from '../../../iam/infrastructure/persistence/usuario.schema';

@Injectable()
export class MikroOrmTareaRepository
  extends TenantAwareRepository<Tarea>
  implements TareaRepository
{
  constructor(
    @Inject(REQUEST_CONTEXT) context: RequestContextService,
    private readonly em: EntityManager,
  ) {
    super(context);
  }

  async findById(id: string): Promise<Tarea | null> {
    const tenantId = this.getTenantId();
    const entity = await this.em.findOne(
      TareaEntity,
      {
        id,
        estudio: { id: tenantId },
      },
      {
        populate: ['estado', 'prioridad', 'cliente', 'estudio', 'responsable'],
      },
    );
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByResponsableId(responsableId: string): Promise<Tarea[]> {
    const tenantId = this.getTenantId();
    const entities = await this.em.find(
      TareaEntity,
      {
        responsable: { id: responsableId },
        estudio: { id: tenantId },
      },
      {
        populate: ['estado', 'prioridad', 'cliente', 'estudio', 'responsable'],
      },
    );
    return entities.map((e) => this.toDomain(e));
  }

  async findAll(): Promise<Tarea[]> {
    const tenantId = this.getTenantId();
    const entities = await this.em.find(
      TareaEntity,
      {
        estudio: { id: tenantId },
      },
      {
        populate: ['estado', 'prioridad', 'cliente', 'estudio', 'responsable'],
      },
    );
    return entities.map((e) => this.toDomain(e));
  }

  async save(tarea: Tarea): Promise<void> {
    const [estado, prioridad] = await Promise.all([
      this.em.findOneOrFail(EstadoTareaEntity, { codigo: tarea.estado }),
      this.em.findOneOrFail(PrioridadEntity, { codigo: tarea.prioridad }),
    ]);
    const estudio = this.em.getReference(EstudioEntity, tarea.estudioId);
    const cliente = tarea.clienteId
      ? this.em.getReference(ClienteEntity, tarea.clienteId)
      : undefined;
    const responsable = tarea.responsableId
      ? this.em.getReference(UsuarioEntity, tarea.responsableId)
      : undefined;

    const tenantId = this.getTenantId();
    const existing = await this.em.findOne(TareaEntity, { id: tarea.id, estudio: { id: tenantId } });
    if (existing) {
      existing.titulo = tarea.titulo;
      existing.descripcion = tarea.descripcion;
      existing.cliente = cliente;
      existing.estudio = estudio;
      existing.estado = estado;
      existing.prioridad = prioridad;
      existing.responsable = responsable;
      existing.horasRegistradas = tarea.horasRegistradas;
      existing.comentarios = tarea.comentarios.map((c) => ({
        usuarioId: c.usuarioId,
        texto: c.texto,
        fecha: c.fecha.toISOString(),
      }));
    } else {
      this.em.create(TareaEntity, {
        id: tarea.id,
        titulo: tarea.titulo,
        descripcion: tarea.descripcion,
        cliente,
        estudio,
        estado,
        prioridad,
        responsable,
        horasRegistradas: tarea.horasRegistradas,
        comentarios: tarea.comentarios.map((c) => ({
          usuarioId: c.usuarioId,
          texto: c.texto,
          fecha: c.fecha.toISOString(),
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await this.em.flush();
  }

  async delete(tarea: Tarea): Promise<void> {
    const tenantId = this.getTenantId();
    const entity = await this.em.findOne(TareaEntity, { id: tarea.id, estudio: { id: tenantId } });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }

  private toDomain(entity: TareaEntity): Tarea {
    return Tarea.create(
      {
        titulo: entity.titulo,
        descripcion: entity.descripcion,
        clienteId: entity.cliente?.id,
        estudioId: entity.estudio.id,
        prioridad: entity.prioridad.codigo as Prioridad,
      },
      entity.id,
    );
  }
}
