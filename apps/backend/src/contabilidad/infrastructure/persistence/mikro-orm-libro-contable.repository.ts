import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { LibroContableRepository } from '../../domain/repositories/libro-contable.repository';
import { LibroContable, type TipoLibro } from '../../domain/entities/libro-contable.entity';
import { LibroContableEntity } from './libro-contable.schema';
import { TipoLibroEntity } from '../../../shared/infrastructure/persistence/tipo-libro.schema';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';

@Injectable()
export class MikroOrmLibroContableRepository implements LibroContableRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<LibroContable | null> {
    const entity = await this.em.findOne(LibroContableEntity, { id }, {
      populate: ['tipoLibro', 'cliente', 'estudio'],
    });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByClienteId(clienteId: string, estudioId: string): Promise<LibroContable[]> {
    const entities = await this.em.find(LibroContableEntity, {
      cliente: { id: clienteId },
      estudio: { id: estudioId },
    }, {
      populate: ['tipoLibro', 'cliente', 'estudio'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async findByEstudioId(estudioId: string): Promise<LibroContable[]> {
    const entities = await this.em.find(LibroContableEntity, { estudio: { id: estudioId } }, {
      populate: ['tipoLibro', 'cliente', 'estudio'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async findAll(): Promise<LibroContable[]> {
    const entities = await this.em.findAll(LibroContableEntity, {
      populate: ['tipoLibro', 'cliente', 'estudio'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async save(libro: LibroContable): Promise<void> {
    const tipoLibro = await this.em.findOneOrFail(TipoLibroEntity, { codigo: libro.tipo });
    const cliente = this.em.getReference(ClienteEntity, libro.clienteId);
    const estudio = this.em.getReference(EstudioEntity, libro.estudioId);

    const existing = await this.em.findOne(LibroContableEntity, { id: libro.id });
    if (existing) {
      existing.cliente = cliente;
      existing.estudio = estudio;
      existing.tipoLibro = tipoLibro;
      existing.periodo = libro.periodo;
      existing.isRubricado = libro.isRubricado;
      existing.numeroRubrica = libro.numeroRubrica;
    } else {
      this.em.create(LibroContableEntity, {
        id: libro.id,
        cliente,
        estudio,
        tipoLibro,
        periodo: libro.periodo,
        isRubricado: libro.isRubricado,
        numeroRubrica: libro.numeroRubrica,
        createdAt: new Date(),
        updatedAt: new Date(),
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
      estudioId: entity.estudio.id,
      tipo: entity.tipoLibro.codigo as TipoLibro,
      periodo: entity.periodo,
    }, entity.id);
  }
}
