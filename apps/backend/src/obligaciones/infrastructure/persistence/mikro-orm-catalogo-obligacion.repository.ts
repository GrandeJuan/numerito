import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { GlobalRepository } from '../../../shared/domain';
import type { CatalogoObligacionRepository } from '../../domain/repositories/catalogo-obligacion.repository';
import { CatalogoObligacion } from '../../domain/entities/catalogo-obligacion.entity';
import { CatalogoObligacionEntity } from './catalogo-obligacion.schema';
import { CatalogoObligacionMapper } from './catalogo-obligacion.mapper';
import type { Jurisdiccion } from '@numerito/shared';

@Injectable()
export class MikroOrmCatalogoObligacionRepository
  extends GlobalRepository<CatalogoObligacion>
  implements CatalogoObligacionRepository
{
  private readonly mapper = new CatalogoObligacionMapper();

  constructor(private readonly em: EntityManager) {
    super();
  }

  async findById(id: string): Promise<CatalogoObligacion | null> {
    const entity = await this.em.findOne(CatalogoObligacionEntity, { id });
    if (!entity) return null;
    return this.mapper.toDomain(this.mapper.fromSchema(entity));
  }

  async findAll(): Promise<CatalogoObligacion[]> {
    const entities = await this.em.find(CatalogoObligacionEntity, {});
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findByJurisdiccion(jurisdiccion: Jurisdiccion): Promise<CatalogoObligacion[]> {
    const entities = await this.em.find(CatalogoObligacionEntity, { jurisdiccion });
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findActivos(): Promise<CatalogoObligacion[]> {
    const entities = await this.em.find(CatalogoObligacionEntity, { activo: true });
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async save(catalogo: CatalogoObligacion): Promise<void> {
    const data = this.mapper.toPersistence(catalogo);
    const existing = await this.em.findOne(CatalogoObligacionEntity, { id: data.id });

    if (existing) {
      existing.nombre = data.nombre;
      existing.tipoObligacion = data.tipoObligacion;
      existing.jurisdiccion = data.jurisdiccion;
      existing.frecuencia = data.frecuencia;
      existing.activo = data.activo;
      existing.updatedAt = new Date();
    } else {
      this.em.create(CatalogoObligacionEntity, {
        id: data.id,
        nombre: data.nombre,
        tipoObligacion: data.tipoObligacion,
        jurisdiccion: data.jurisdiccion,
        frecuencia: data.frecuencia,
        activo: data.activo,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await this.em.flush();
  }

  async delete(catalogo: CatalogoObligacion): Promise<void> {
    const entity = await this.em.findOne(CatalogoObligacionEntity, { id: catalogo.id });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }
}
