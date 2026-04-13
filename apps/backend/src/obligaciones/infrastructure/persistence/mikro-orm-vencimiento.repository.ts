import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { VencimientoRepository } from '../../domain/repositories/vencimiento.repository';
import { Vencimiento, type EstadoVencimiento } from '../../domain/entities/vencimiento.entity';
import { TenantAwareRepository } from '../../../shared/domain';
import {
  RequestContextService,
  REQUEST_CONTEXT,
} from '../../../shared/infrastructure/services/request-context.service';
import { VencimientoEntity } from './vencimiento.schema';
import { TipoObligacionEntity } from '../../../shared/infrastructure/persistence/tipo-obligacion.schema';
import { EstadoVencimientoEntity } from '../../../shared/infrastructure/persistence/estado-vencimiento.schema';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';
import type { TipoObligacion } from '@numerito/shared';

@Injectable()
export class MikroOrmVencimientoRepository
  extends TenantAwareRepository<Vencimiento>
  implements VencimientoRepository
{
  constructor(
    @Inject(REQUEST_CONTEXT) context: RequestContextService,
    private readonly em: EntityManager,
  ) {
    super(context);
  }

  async findById(id: string): Promise<Vencimiento | null> {
    const tenantId = this.getTenantId();
    const entity = await this.em.findOne(
      VencimientoEntity,
      {
        id,
        estudio: { id: tenantId },
      },
      {
        populate: ['tipoObligacion', 'estado', 'cliente', 'estudio'],
      },
    );
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByClienteId(clienteId: string): Promise<Vencimiento[]> {
    const tenantId = this.getTenantId();
    const entities = await this.em.find(
      VencimientoEntity,
      {
        cliente: { id: clienteId },
        estudio: { id: tenantId },
      },
      {
        populate: ['tipoObligacion', 'estado', 'cliente', 'estudio'],
      },
    );
    return entities.map((e) => this.toDomain(e));
  }

  async findByPeriodo(periodo: string): Promise<Vencimiento[]> {
    const tenantId = this.getTenantId();
    const entities = await this.em.find(
      VencimientoEntity,
      {
        periodo,
        estudio: { id: tenantId },
      },
      {
        populate: ['tipoObligacion', 'estado', 'cliente', 'estudio'],
      },
    );
    return entities.map((e) => this.toDomain(e));
  }

  async findByEstado(estado: EstadoVencimiento): Promise<Vencimiento[]> {
    const tenantId = this.getTenantId();
    const entities = await this.em.find(
      VencimientoEntity,
      {
        estado: { codigo: estado },
        estudio: { id: tenantId },
      },
      {
        populate: ['tipoObligacion', 'estado', 'cliente', 'estudio'],
      },
    );
    return entities.map((e) => this.toDomain(e));
  }

  async findProximosAVencer(diasAnticipacion: number): Promise<Vencimiento[]> {
    const tenantId = this.getTenantId();
    const now = new Date();
    const limit = new Date();
    limit.setDate(limit.getDate() + diasAnticipacion);

    const entities = await this.em.find(
      VencimientoEntity,
      {
        estudio: { id: tenantId },
        estado: { codigo: 'PENDIENTE' },
        fechaVencimiento: { $gte: now, $lte: limit },
      },
      {
        populate: ['tipoObligacion', 'estado', 'cliente', 'estudio'],
      },
    );
    return entities.map((e) => this.toDomain(e));
  }

  async findAll(): Promise<Vencimiento[]> {
    const tenantId = this.getTenantId();
    const entities = await this.em.find(
      VencimientoEntity,
      {
        estudio: { id: tenantId },
      },
      {
        populate: ['tipoObligacion', 'estado', 'cliente', 'estudio'],
      },
    );
    return entities.map((e) => this.toDomain(e));
  }

  async save(vencimiento: Vencimiento): Promise<void> {
    const [tipoObligacion, estado] = await Promise.all([
      this.em.findOneOrFail(TipoObligacionEntity, { codigo: vencimiento.tipoObligacion }),
      this.em.findOneOrFail(EstadoVencimientoEntity, { codigo: vencimiento.estado }),
    ]);
    const cliente = this.em.getReference(ClienteEntity, vencimiento.clienteId);
    const estudio = this.em.getReference(EstudioEntity, vencimiento.estudioId);

    const existing = await this.em.findOne(VencimientoEntity, { id: vencimiento.id });
    if (existing) {
      existing.cliente = cliente;
      existing.estudio = estudio;
      existing.tipoObligacion = tipoObligacion;
      existing.periodo = vencimiento.periodo;
      existing.fechaVencimiento = vencimiento.fechaVencimiento;
      existing.descripcion = vencimiento.descripcion;
      existing.estado = estado;
    } else {
      this.em.create(VencimientoEntity, {
        id: vencimiento.id,
        cliente,
        estudio,
        tipoObligacion,
        periodo: vencimiento.periodo,
        fechaVencimiento: vencimiento.fechaVencimiento,
        descripcion: vencimiento.descripcion,
        estado,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await this.em.flush();
  }

  async delete(vencimiento: Vencimiento): Promise<void> {
    const entity = await this.em.findOne(VencimientoEntity, { id: vencimiento.id });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }

  private toDomain(entity: VencimientoEntity): Vencimiento {
    return Vencimiento.create(
      {
        clienteId: entity.cliente.id,
        estudioId: entity.estudio.id,
        tipoObligacion: entity.tipoObligacion.codigo as TipoObligacion,
        periodo: entity.periodo,
        fechaVencimiento: entity.fechaVencimiento,
        descripcion: entity.descripcion,
      },
      entity.id,
    );
  }
}
