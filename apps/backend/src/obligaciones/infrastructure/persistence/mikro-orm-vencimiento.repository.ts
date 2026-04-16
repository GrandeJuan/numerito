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
import { VencimientoMapper } from './vencimiento.mapper';

@Injectable()
export class MikroOrmVencimientoRepository
  extends TenantAwareRepository<Vencimiento>
  implements VencimientoRepository
{
  private readonly mapper = new VencimientoMapper();

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
    return this.mapper.toDomain(this.mapper.fromSchema(entity));
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
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
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
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
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
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
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
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
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
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async save(vencimiento: Vencimiento): Promise<void> {
    const data = this.mapper.toPersistence(vencimiento);
    const [tipoObligacion, estado] = await Promise.all([
      this.em.findOneOrFail(TipoObligacionEntity, { codigo: data.tipoObligacion }),
      this.em.findOneOrFail(EstadoVencimientoEntity, { codigo: data.estado }),
    ]);
    const cliente = this.em.getReference(ClienteEntity, data.clienteId);
    const estudio = this.em.getReference(EstudioEntity, data.estudioId);

    const tenantId = this.getTenantId();
    const existing = await this.em.findOne(VencimientoEntity, { id: data.id, estudio: { id: tenantId } });
    if (existing) {
      existing.cliente = cliente;
      existing.estudio = estudio;
      existing.tipoObligacion = tipoObligacion;
      existing.periodo = data.periodo;
      existing.fechaVencimiento = data.fechaVencimiento;
      existing.descripcion = data.descripcion;
      existing.estado = estado;
    } else {
      this.em.create(VencimientoEntity, {
        id: data.id,
        cliente,
        estudio,
        tipoObligacion,
        periodo: data.periodo,
        fechaVencimiento: data.fechaVencimiento,
        descripcion: data.descripcion,
        estado,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await this.em.flush();
  }

  async delete(vencimiento: Vencimiento): Promise<void> {
    const tenantId = this.getTenantId();
    const entity = await this.em.findOne(VencimientoEntity, { id: vencimiento.id, estudio: { id: tenantId } });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }
}
