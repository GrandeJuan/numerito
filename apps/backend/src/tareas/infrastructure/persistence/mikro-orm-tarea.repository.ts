import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { TareaRepository } from '../../domain/repositories/tarea.repository';
import { Tarea, type Prioridad } from '../../domain/entities/tarea.entity';
import { TareaEntity } from './tarea.schema';
import { EstadoTareaEntity } from '../../../shared/infrastructure/persistence/estado-tarea.schema';
import { PrioridadEntity } from '../../../shared/infrastructure/persistence/prioridad.schema';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../tenant/infrastructure/persistence/estudio.schema';
import { UsuarioEntity } from '../../../iam/infrastructure/persistence/usuario.schema';

@Injectable()
export class MikroOrmTareaRepository implements TareaRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Tarea | null> {
    const entity = await this.em.findOne(TareaEntity, { id }, {
      populate: ['estado', 'prioridad', 'cliente', 'tenant', 'responsable'],
    });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByTenantId(tenantId: string): Promise<Tarea[]> {
    const entities = await this.em.find(TareaEntity, { tenant: { id: tenantId } }, {
      populate: ['estado', 'prioridad', 'cliente', 'tenant', 'responsable'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async findByResponsableId(responsableId: string, tenantId: string): Promise<Tarea[]> {
    const entities = await this.em.find(TareaEntity, {
      responsable: { id: responsableId },
      tenant: { id: tenantId },
    }, {
      populate: ['estado', 'prioridad', 'cliente', 'tenant', 'responsable'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async findAll(): Promise<Tarea[]> {
    const entities = await this.em.findAll(TareaEntity, {
      populate: ['estado', 'prioridad', 'cliente', 'tenant', 'responsable'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async save(tarea: Tarea): Promise<void> {
    const [estado, prioridad] = await Promise.all([
      this.em.findOneOrFail(EstadoTareaEntity, { codigo: tarea.estado }),
      this.em.findOneOrFail(PrioridadEntity, { codigo: tarea.prioridad }),
    ]);
    const tenant = this.em.getReference(EstudioEntity, tarea.tenantId);
    const cliente = tarea.clienteId
      ? this.em.getReference(ClienteEntity, tarea.clienteId)
      : undefined;
    const responsable = tarea.responsableId
      ? this.em.getReference(UsuarioEntity, tarea.responsableId)
      : undefined;

    const existing = await this.em.findOne(TareaEntity, { id: tarea.id });
    if (existing) {
      existing.titulo = tarea.titulo;
      existing.descripcion = tarea.descripcion;
      existing.cliente = cliente;
      existing.tenant = tenant;
      existing.estado = estado;
      existing.prioridad = prioridad;
      existing.responsable = responsable;
      existing.horasRegistradas = tarea.horasRegistradas;
      existing.comentarios = tarea.comentarios.map(c => ({
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
        tenant,
        estado,
        prioridad,
        responsable,
        horasRegistradas: tarea.horasRegistradas,
        comentarios: tarea.comentarios.map(c => ({
          usuarioId: c.usuarioId,
          texto: c.texto,
          fecha: c.fecha.toISOString(),
        })),
      });
    }
    await this.em.flush();
  }

  async delete(tarea: Tarea): Promise<void> {
    const entity = await this.em.findOne(TareaEntity, { id: tarea.id });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }

  private toDomain(entity: TareaEntity): Tarea {
    return Tarea.create({
      titulo: entity.titulo,
      descripcion: entity.descripcion,
      clienteId: entity.cliente?.id,
      tenantId: entity.tenant.id,
      prioridad: entity.prioridad.codigo as Prioridad,
    }, entity.id);
  }
}
