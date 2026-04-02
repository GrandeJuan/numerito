import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { VencimientoRepository } from '../../domain/repositories/vencimiento.repository';
import { Vencimiento, type EstadoVencimiento } from '../../domain/entities/vencimiento.entity';
import { VencimientoEntity } from './vencimiento.schema';
import { TipoObligacionEntity } from '../../../shared/infrastructure/persistence/tipo-obligacion.schema';
import { EstadoVencimientoEntity } from '../../../shared/infrastructure/persistence/estado-vencimiento.schema';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../tenant/infrastructure/persistence/estudio.schema';
import type { TipoObligacion } from '@numerito/shared';

@Injectable()
export class MikroOrmVencimientoRepository implements VencimientoRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Vencimiento | null> {
    const entity = await this.em.findOne(VencimientoEntity, { id }, {
      populate: ['tipoObligacion', 'estado', 'cliente', 'tenant'],
    });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByClienteId(clienteId: string, tenantId: string): Promise<Vencimiento[]> {
    const entities = await this.em.find(VencimientoEntity, {
      cliente: { id: clienteId },
      tenant: { id: tenantId },
    }, {
      populate: ['tipoObligacion', 'estado', 'cliente', 'tenant'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async findByTenantId(tenantId: string): Promise<Vencimiento[]> {
    const entities = await this.em.find(VencimientoEntity, { tenant: { id: tenantId } }, {
      populate: ['tipoObligacion', 'estado', 'cliente', 'tenant'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async findByPeriodo(periodo: string, tenantId: string): Promise<Vencimiento[]> {
    const entities = await this.em.find(VencimientoEntity, {
      periodo,
      tenant: { id: tenantId },
    }, {
      populate: ['tipoObligacion', 'estado', 'cliente', 'tenant'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async findByEstado(estado: EstadoVencimiento, tenantId: string): Promise<Vencimiento[]> {
    const entities = await this.em.find(VencimientoEntity, {
      estado: { codigo: estado },
      tenant: { id: tenantId },
    }, {
      populate: ['tipoObligacion', 'estado', 'cliente', 'tenant'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async findProximosAVencer(diasAnticipacion: number, tenantId: string): Promise<Vencimiento[]> {
    const now = new Date();
    const limit = new Date();
    limit.setDate(limit.getDate() + diasAnticipacion);

    const entities = await this.em.find(VencimientoEntity, {
      tenant: { id: tenantId },
      estado: { codigo: 'PENDIENTE' },
      fechaVencimiento: { $gte: now, $lte: limit },
    }, {
      populate: ['tipoObligacion', 'estado', 'cliente', 'tenant'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async findAll(): Promise<Vencimiento[]> {
    const entities = await this.em.findAll(VencimientoEntity, {
      populate: ['tipoObligacion', 'estado', 'cliente', 'tenant'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async save(vencimiento: Vencimiento): Promise<void> {
    const [tipoObligacion, estado] = await Promise.all([
      this.em.findOneOrFail(TipoObligacionEntity, { codigo: vencimiento.tipoObligacion }),
      this.em.findOneOrFail(EstadoVencimientoEntity, { codigo: vencimiento.estado }),
    ]);
    const cliente = this.em.getReference(ClienteEntity, vencimiento.clienteId);
    const tenant = this.em.getReference(EstudioEntity, vencimiento.tenantId);

    const existing = await this.em.findOne(VencimientoEntity, { id: vencimiento.id });
    if (existing) {
      existing.cliente = cliente;
      existing.tenant = tenant;
      existing.tipoObligacion = tipoObligacion;
      existing.periodo = vencimiento.periodo;
      existing.fechaVencimiento = vencimiento.fechaVencimiento;
      existing.descripcion = vencimiento.descripcion;
      existing.estado = estado;
    } else {
      this.em.create(VencimientoEntity, {
        id: vencimiento.id,
        cliente,
        tenant,
        tipoObligacion,
        periodo: vencimiento.periodo,
        fechaVencimiento: vencimiento.fechaVencimiento,
        descripcion: vencimiento.descripcion,
        estado,
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
    return Vencimiento.create({
      clienteId: entity.cliente.id,
      tenantId: entity.tenant.id,
      tipoObligacion: entity.tipoObligacion.codigo as TipoObligacion,
      periodo: entity.periodo,
      fechaVencimiento: entity.fechaVencimiento,
      descripcion: entity.descripcion,
    }, entity.id);
  }
}
