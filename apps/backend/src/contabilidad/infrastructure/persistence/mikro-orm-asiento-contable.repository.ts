import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AsientoContableRepository } from '../../domain/repositories/asiento-contable.repository';
import { AsientoContable, type LineaAsiento } from '../../domain/entities/asiento-contable.entity';
import { TenantAwareRepository } from '../../../shared/domain';
import {
  RequestContextService,
  REQUEST_CONTEXT,
} from '../../../shared/infrastructure/services/request-context.service';
import { AsientoContableEntity } from './asiento-contable.schema';
import { LibroContableEntity } from './libro-contable.schema';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';

@Injectable()
export class MikroOrmAsientoContableRepository
  extends TenantAwareRepository<AsientoContable>
  implements AsientoContableRepository
{
  constructor(
    @Inject(REQUEST_CONTEXT) context: RequestContextService,
    private readonly em: EntityManager,
  ) {
    super(context);
  }

  async findById(id: string): Promise<AsientoContable | null> {
    const tenantId = this.getTenantId();
    const entity = await this.em.findOne(
      AsientoContableEntity,
      {
        id,
        estudio: { id: tenantId },
      },
      {
        populate: ['libro', 'cliente', 'estudio'],
      },
    );
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByLibroId(libroId: string): Promise<AsientoContable[]> {
    const tenantId = this.getTenantId();
    const entities = await this.em.find(
      AsientoContableEntity,
      {
        libro: { id: libroId },
        estudio: { id: tenantId },
      },
      {
        populate: ['libro', 'cliente', 'estudio'],
      },
    );
    return entities.map((e) => this.toDomain(e));
  }

  async findByClienteId(clienteId: string): Promise<AsientoContable[]> {
    const tenantId = this.getTenantId();
    const entities = await this.em.find(
      AsientoContableEntity,
      {
        cliente: { id: clienteId },
        estudio: { id: tenantId },
      },
      {
        populate: ['libro', 'cliente', 'estudio'],
      },
    );
    return entities.map((e) => this.toDomain(e));
  }

  async findAll(): Promise<AsientoContable[]> {
    const tenantId = this.getTenantId();
    const entities = await this.em.find(
      AsientoContableEntity,
      {
        estudio: { id: tenantId },
      },
      {
        populate: ['libro', 'cliente', 'estudio'],
      },
    );
    return entities.map((e) => this.toDomain(e));
  }

  async save(asiento: AsientoContable): Promise<void> {
    const libro = this.em.getReference(LibroContableEntity, asiento.libroId);
    const cliente = this.em.getReference(ClienteEntity, asiento.clienteId);
    const estudio = this.em.getReference(EstudioEntity, asiento.estudioId);

    const tenantId = this.getTenantId();
    const existing = await this.em.findOne(AsientoContableEntity, { id: asiento.id, estudio: { id: tenantId } });
    if (existing) {
      existing.libro = libro;
      existing.cliente = cliente;
      existing.estudio = estudio;
      existing.fecha = asiento.fecha;
      existing.descripcion = asiento.descripcion;
      existing.lineas = asiento.lineas;
    } else {
      this.em.create(AsientoContableEntity, {
        id: asiento.id,
        libro,
        cliente,
        estudio,
        fecha: asiento.fecha,
        descripcion: asiento.descripcion,
        lineas: asiento.lineas,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await this.em.flush();
  }

  async delete(asiento: AsientoContable): Promise<void> {
    const tenantId = this.getTenantId();
    const entity = await this.em.findOne(AsientoContableEntity, { id: asiento.id, estudio: { id: tenantId } });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }

  private toDomain(entity: AsientoContableEntity): AsientoContable {
    return AsientoContable.create(
      {
        libroId: entity.libro.id,
        clienteId: entity.cliente.id,
        estudioId: entity.estudio.id,
        fecha: entity.fecha,
        descripcion: entity.descripcion,
        lineas: entity.lineas as LineaAsiento[],
      },
      entity.id,
    );
  }
}
