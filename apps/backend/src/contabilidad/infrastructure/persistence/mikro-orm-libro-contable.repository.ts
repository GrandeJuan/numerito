import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { LibroContableRepository } from '../../domain/repositories/libro-contable.repository';
import { LibroContable, type TipoLibro } from '../../domain/entities/libro-contable.entity';
import { LibroContableEntity } from './libro-contable.schema';
import { TipoLibroEntity } from '../../../shared/infrastructure/persistence/tipo-libro.schema';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../tenant/infrastructure/persistence/estudio.schema';

@Injectable()
export class MikroOrmLibroContableRepository implements LibroContableRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<LibroContable | null> {
    const entity = await this.em.findOne(LibroContableEntity, { id }, {
      populate: ['tipoLibro', 'cliente', 'tenant'],
    });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByClienteId(clienteId: string, tenantId: string): Promise<LibroContable[]> {
    const entities = await this.em.find(LibroContableEntity, {
      cliente: { id: clienteId },
      tenant: { id: tenantId },
    }, {
      populate: ['tipoLibro', 'cliente', 'tenant'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async findByTenantId(tenantId: string): Promise<LibroContable[]> {
    const entities = await this.em.find(LibroContableEntity, { tenant: { id: tenantId } }, {
      populate: ['tipoLibro', 'cliente', 'tenant'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async findAll(): Promise<LibroContable[]> {
    const entities = await this.em.findAll(LibroContableEntity, {
      populate: ['tipoLibro', 'cliente', 'tenant'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async save(libro: LibroContable): Promise<void> {
    const tipoLibro = await this.em.findOneOrFail(TipoLibroEntity, { codigo: libro.tipo });
    const cliente = this.em.getReference(ClienteEntity, libro.clienteId);
    const tenant = this.em.getReference(EstudioEntity, libro.tenantId);

    const existing = await this.em.findOne(LibroContableEntity, { id: libro.id });
    if (existing) {
      existing.cliente = cliente;
      existing.tenant = tenant;
      existing.tipoLibro = tipoLibro;
      existing.periodo = libro.periodo;
      existing.isRubricado = libro.isRubricado;
      existing.numeroRubrica = libro.numeroRubrica;
    } else {
      this.em.create(LibroContableEntity, {
        id: libro.id,
        cliente,
        tenant,
        tipoLibro,
        periodo: libro.periodo,
        isRubricado: libro.isRubricado,
        numeroRubrica: libro.numeroRubrica,
      });
    }
    await this.em.flush();
  }

  async delete(libro: LibroContable): Promise<void> {
    const entity = await this.em.findOne(LibroContableEntity, { id: libro.id });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }

  private toDomain(entity: LibroContableEntity): LibroContable {
    return LibroContable.create({
      clienteId: entity.cliente.id,
      tenantId: entity.tenant.id,
      tipo: entity.tipoLibro.codigo as TipoLibro,
      periodo: entity.periodo,
    }, entity.id);
  }
}
