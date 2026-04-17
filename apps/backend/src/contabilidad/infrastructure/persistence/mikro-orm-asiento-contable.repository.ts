import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import type { AsientoContableRepository } from '../../domain/repositories/asiento-contable.repository';
import { AsientoContable } from '../../domain/entities/asiento-contable.entity';
import { TenantAwareRepository } from '../../../shared/domain';
import {
  RequestContextService,
  REQUEST_CONTEXT,
} from '../../../shared/infrastructure/services/request-context.service';
import { AsientoContableEntity } from './asiento-contable.schema';
import { LibroContableEntity } from './libro-contable.schema';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';
import { AsientoContableMapper } from './asiento-contable.mapper';

@Injectable()
export class MikroOrmAsientoContableRepository
  extends TenantAwareRepository<AsientoContable>
  implements AsientoContableRepository
{
  private readonly mapper = new AsientoContableMapper();

  constructor(
    @Inject(REQUEST_CONTEXT) context: RequestContextService,
    private readonly em: EntityManager,
  ) {
    super(context);
  }

  async findById(principal: EstudioPrincipal, id: string): Promise<AsientoContable | null> {
    const entity = await this.em.findOne(
      AsientoContableEntity,
      {
        id,
        estudio: { id: principal.estudioId },
      },
      {
        populate: ['libro', 'cliente', 'estudio'],
      },
    );
    if (!entity) return null;
    return this.mapper.toDomain(this.mapper.fromSchema(entity));
  }

  async findByLibroId(principal: EstudioPrincipal, libroId: string): Promise<AsientoContable[]> {
    const entities = await this.em.find(
      AsientoContableEntity,
      {
        libro: { id: libroId },
        estudio: { id: principal.estudioId },
      },
      {
        populate: ['libro', 'cliente', 'estudio'],
      },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findByClienteId(principal: EstudioPrincipal, clienteId: string): Promise<AsientoContable[]> {
    const entities = await this.em.find(
      AsientoContableEntity,
      {
        cliente: { id: clienteId },
        estudio: { id: principal.estudioId },
      },
      {
        populate: ['libro', 'cliente', 'estudio'],
      },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findAll(principal: EstudioPrincipal): Promise<AsientoContable[]> {
    const entities = await this.em.find(
      AsientoContableEntity,
      {
        estudio: { id: principal.estudioId },
      },
      {
        populate: ['libro', 'cliente', 'estudio'],
      },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async save(principal: EstudioPrincipal, asiento: AsientoContable): Promise<void> {
    const data = this.mapper.toPersistence(asiento);
    const libro = this.em.getReference(LibroContableEntity, data.libroId);
    const cliente = this.em.getReference(ClienteEntity, data.clienteId);
    const estudio = this.em.getReference(EstudioEntity, data.estudioId);

    const existing = await this.em.findOne(AsientoContableEntity, { id: data.id, estudio: { id: principal.estudioId } });
    if (existing) {
      existing.libro = libro;
      existing.cliente = cliente;
      existing.estudio = estudio;
      existing.fecha = data.fecha;
      existing.descripcion = data.descripcion;
      existing.lineas = data.lineas;
    } else {
      this.em.create(AsientoContableEntity, {
        id: data.id,
        libro,
        cliente,
        estudio,
        fecha: data.fecha,
        descripcion: data.descripcion,
        lineas: data.lineas,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await this.em.flush();
  }

  async delete(principal: EstudioPrincipal, asiento: AsientoContable): Promise<void> {
    const entity = await this.em.findOne(AsientoContableEntity, { id: asiento.id, estudio: { id: principal.estudioId } });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }
}
