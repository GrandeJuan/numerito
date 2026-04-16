import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { TareaRepository } from '../../domain/repositories/tarea.repository';
import { Tarea } from '../../domain/entities/tarea.entity';
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
import { TareaMapper } from './tarea.mapper';

@Injectable()
export class MikroOrmTareaRepository
  extends TenantAwareRepository<Tarea>
  implements TareaRepository
{
  private readonly mapper = new TareaMapper();

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
    return this.mapper.toDomain(this.mapper.fromSchema(entity));
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
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
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
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async save(tarea: Tarea): Promise<void> {
    const data = this.mapper.toPersistence(tarea);
    const [estado, prioridad] = await Promise.all([
      this.em.findOneOrFail(EstadoTareaEntity, { codigo: data.estado }),
      this.em.findOneOrFail(PrioridadEntity, { codigo: data.prioridad }),
    ]);
    const estudio = this.em.getReference(EstudioEntity, data.estudioId);
    const cliente = data.clienteId
      ? this.em.getReference(ClienteEntity, data.clienteId)
      : undefined;
    const responsable = data.responsableId
      ? this.em.getReference(UsuarioEntity, data.responsableId)
      : undefined;

    const tenantId = this.getTenantId();
    const existing = await this.em.findOne(TareaEntity, { id: data.id, estudio: { id: tenantId } });
    if (existing) {
      existing.titulo = data.titulo;
      existing.descripcion = data.descripcion;
      existing.cliente = cliente;
      existing.estudio = estudio;
      existing.estado = estado;
      existing.prioridad = prioridad;
      existing.responsable = responsable;
      existing.horasRegistradas = data.horasRegistradas;
      existing.comentarios = data.comentarios;
    } else {
      this.em.create(TareaEntity, {
        id: data.id,
        titulo: data.titulo,
        descripcion: data.descripcion,
        cliente,
        estudio,
        estado,
        prioridad,
        responsable,
        horasRegistradas: data.horasRegistradas,
        comentarios: data.comentarios,
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
}
