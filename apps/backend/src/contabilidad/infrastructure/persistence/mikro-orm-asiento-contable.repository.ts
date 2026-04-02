import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AsientoContableRepository } from '../../domain/repositories/asiento-contable.repository';
import { AsientoContable, type LineaAsiento } from '../../domain/entities/asiento-contable.entity';
import { AsientoContableEntity } from './asiento-contable.schema';
import { LibroContableEntity } from './libro-contable.schema';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../tenant/infrastructure/persistence/estudio.schema';

@Injectable()
export class MikroOrmAsientoContableRepository implements AsientoContableRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<AsientoContable | null> {
    const entity = await this.em.findOne(AsientoContableEntity, { id }, {
      populate: ['libro', 'cliente', 'tenant'],
    });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByLibroId(libroId: string): Promise<AsientoContable[]> {
    const entities = await this.em.find(AsientoContableEntity, {
      libro: { id: libroId },
    }, {
      populate: ['libro', 'cliente', 'tenant'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async findByClienteId(clienteId: string, tenantId: string): Promise<AsientoContable[]> {
    const entities = await this.em.find(AsientoContableEntity, {
      cliente: { id: clienteId },
      tenant: { id: tenantId },
    }, {
      populate: ['libro', 'cliente', 'tenant'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async findAll(): Promise<AsientoContable[]> {
    const entities = await this.em.findAll(AsientoContableEntity, {
      populate: ['libro', 'cliente', 'tenant'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async save(asiento: AsientoContable): Promise<void> {
    const libro = this.em.getReference(LibroContableEntity, asiento.libroId);
    const cliente = this.em.getReference(ClienteEntity, asiento.clienteId);
    const tenant = this.em.getReference(EstudioEntity, asiento.tenantId);

    const existing = await this.em.findOne(AsientoContableEntity, { id: asiento.id });
    if (existing) {
      existing.libro = libro;
      existing.cliente = cliente;
      existing.tenant = tenant;
      existing.fecha = asiento.fecha;
      existing.descripcion = asiento.descripcion;
      existing.lineas = asiento.lineas;
    } else {
      this.em.create(AsientoContableEntity, {
        id: asiento.id,
        libro,
        cliente,
        tenant,
        fecha: asiento.fecha,
        descripcion: asiento.descripcion,
        lineas: asiento.lineas,
      });
    }
    await this.em.flush();
  }

  async delete(asiento: AsientoContable): Promise<void> {
    const entity = await this.em.findOne(AsientoContableEntity, { id: asiento.id });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }

  private toDomain(entity: AsientoContableEntity): AsientoContable {
    return AsientoContable.create({
      libroId: entity.libro.id,
      clienteId: entity.cliente.id,
      tenantId: entity.tenant.id,
      fecha: entity.fecha,
      descripcion: entity.descripcion,
      lineas: entity.lineas as LineaAsiento[],
    }, entity.id);
  }
}
