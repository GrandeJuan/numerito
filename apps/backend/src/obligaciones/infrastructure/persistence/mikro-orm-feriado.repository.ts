import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { GlobalRepository } from '../../../shared/domain';
import type {
  FeriadoRepository,
  FeriadoSummary,
  FeriadoScrapeData,
} from '../../domain/repositories/feriado.repository';
import { DiaFeriado } from '../../domain/entities/dia-feriado.entity';
import { DiaFeriadoEntity } from './dia-feriado.schema';
import { DiaFeriadoMapper } from './dia-feriado.mapper';
import type { TipoFeriado, Jurisdiccion } from '@numerito/shared';

@Injectable()
export class MikroOrmFeriadoRepository
  extends GlobalRepository<DiaFeriado>
  implements FeriadoRepository
{
  private readonly mapper = new DiaFeriadoMapper();

  constructor(private readonly em: EntityManager) {
    super();
  }

  async findById(id: string): Promise<DiaFeriado | null> {
    const entity = await this.em.findOne(DiaFeriadoEntity, { id });
    if (!entity) return null;
    return this.mapper.toDomain(this.mapper.fromSchema(entity));
  }

  async findAll(): Promise<DiaFeriado[]> {
    const entities = await this.em.find(DiaFeriadoEntity, {}, { orderBy: { fecha: 'ASC' } });
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findByFecha(fecha: Date): Promise<DiaFeriado[]> {
    const entities = await this.em.find(DiaFeriadoEntity, { fecha });
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findByFechaAsSummary(fecha: Date): Promise<FeriadoSummary[]> {
    const entities = await this.em.find(DiaFeriadoEntity, { fecha });
    return entities.map((e) => ({
      tipo: e.tipo as TipoFeriado,
      jurisdiccionAfectada: (e.jurisdiccionAfectada ?? null) as Jurisdiccion | null,
    }));
  }

  async createFromScrape(data: FeriadoScrapeData): Promise<void> {
    const entity = DiaFeriado.create({
      fecha: data.fecha,
      tipo: data.tipo,
      descripcion: data.descripcion,
      jurisdiccionAfectada: data.jurisdiccionAfectada,
    });
    await this.save(entity);
  }

  async findByRango(desde: Date, hasta: Date): Promise<DiaFeriado[]> {
    const entities = await this.em.find(
      DiaFeriadoEntity,
      { fecha: { $gte: desde, $lte: hasta } },
      { orderBy: { fecha: 'ASC' } },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async save(feriado: DiaFeriado): Promise<void> {
    const data = this.mapper.toPersistence(feriado);
    const existing = await this.em.findOne(DiaFeriadoEntity, { id: data.id });

    if (existing) {
      existing.fecha = data.fecha;
      existing.tipo = data.tipo;
      existing.descripcion = data.descripcion;
      existing.jurisdiccionAfectada = data.jurisdiccionAfectada;
      existing.updatedAt = new Date();
    } else {
      this.em.create(DiaFeriadoEntity, {
        id: data.id,
        fecha: data.fecha,
        tipo: data.tipo,
        descripcion: data.descripcion,
        jurisdiccionAfectada: data.jurisdiccionAfectada,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await this.em.flush();
  }

  async delete(feriado: DiaFeriado): Promise<void> {
    const entity = await this.em.findOne(DiaFeriadoEntity, { id: feriado.id });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }
}
