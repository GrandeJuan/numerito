import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { LibroContableRepository } from '../../domain/repositories/libro-contable.repository';
import { LibroContable } from '../../domain/entities/libro-contable.entity';
import { TenantAwareRepository } from '../../../shared/domain';
import {
  RequestContextService,
  REQUEST_CONTEXT,
} from '../../../shared/infrastructure/services/request-context.service';
import { LibroContableEntity } from './libro-contable.schema';
import { TipoLibroEntity } from '../../../shared/infrastructure/persistence/tipo-libro.schema';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';
import { LibroContableMapper } from './libro-contable.mapper';

@Injectable()
export class MikroOrmLibroContableRepository
  extends TenantAwareRepository<LibroContable>
  implements LibroContableRepository
{
  private readonly mapper = new LibroContableMapper();

  constructor(
    @Inject(REQUEST_CONTEXT) context: RequestContextService,
    private readonly em: EntityManager,
  ) {
    super(context);
  }

  async findById(id: string): Promise<LibroContable | null> {
    const tenantId = this.getTenantId();
    const entity = await this.em.findOne(
      LibroContableEntity,
      {
        id,
        estudio: { id: tenantId },
      },
      {
        populate: ['tipoLibro', 'cliente', 'estudio'],
      },
    );
    if (!entity) return null;
    return this.mapper.toDomain(this.mapper.fromSchema(entity));
  }

  async findByClienteId(clienteId: string): Promise<LibroContable[]> {
    const tenantId = this.getTenantId();
    const entities = await this.em.find(
      LibroContableEntity,
      {
        cliente: { id: clienteId },
        estudio: { id: tenantId },
      },
      {
        populate: ['tipoLibro', 'cliente', 'estudio'],
      },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findAll(): Promise<LibroContable[]> {
    const tenantId = this.getTenantId();
    const entities = await this.em.find(
      LibroContableEntity,
      {
        estudio: { id: tenantId },
      },
      {
        populate: ['tipoLibro', 'cliente', 'estudio'],
      },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async save(libro: LibroContable): Promise<void> {
    const data = this.mapper.toPersistence(libro);
    const tipoLibro = await this.em.findOneOrFail(TipoLibroEntity, { codigo: data.tipo });
    const cliente = this.em.getReference(ClienteEntity, data.clienteId);
    const estudio = this.em.getReference(EstudioEntity, data.estudioId);

    const tenantId = this.getTenantId();
    const existing = await this.em.findOne(LibroContableEntity, { id: data.id, estudio: { id: tenantId } });
    if (existing) {
      existing.cliente = cliente;
      existing.estudio = estudio;
      existing.tipoLibro = tipoLibro;
      existing.periodo = data.periodo;
      existing.isRubricado = data.isRubricado;
      existing.numeroRubrica = data.numeroRubrica;
    } else {
      this.em.create(LibroContableEntity, {
        id: data.id,
        cliente,
        estudio,
        tipoLibro,
        periodo: data.periodo,
        isRubricado: data.isRubricado,
        numeroRubrica: data.numeroRubrica,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await this.em.flush();
  }

  async delete(libro: LibroContable): Promise<void> {
    const tenantId = this.getTenantId();
    const entity = await this.em.findOne(LibroContableEntity, { id: libro.id, estudio: { id: tenantId } });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }
}
