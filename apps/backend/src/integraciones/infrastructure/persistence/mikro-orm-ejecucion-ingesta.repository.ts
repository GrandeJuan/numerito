import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { GlobalRepository } from '../../../shared/domain';
import type { EjecucionIngestaRepository } from '../../domain/repositories/ejecucion-ingesta.repository';
import { EjecucionIngesta } from '../../domain/entities/ejecucion-ingesta.entity';
import type { FuenteIngesta } from '../../domain/entities/configuracion-ingesta.entity';
import { EjecucionIngestaEntity } from './ejecucion-ingesta.schema';
import { EjecucionIngestaMapper } from './ejecucion-ingesta.mapper';

@Injectable()
export class MikroOrmEjecucionIngestaRepository
  extends GlobalRepository<EjecucionIngesta>
  implements EjecucionIngestaRepository
{
  private readonly mapper = new EjecucionIngestaMapper();

  constructor(private readonly em: EntityManager) {
    super();
  }

  async findById(id: string): Promise<EjecucionIngesta | null> {
    const entity = await this.em.findOne(EjecucionIngestaEntity, { id });
    if (!entity) return null;
    return this.mapper.toDomain(this.mapper.fromSchema(entity));
  }

  async findByIngestaId(ingestaId: string): Promise<EjecucionIngesta | null> {
    const entity = await this.em.findOne(EjecucionIngestaEntity, { ingestaId });
    if (!entity) return null;
    return this.mapper.toDomain(this.mapper.fromSchema(entity));
  }

  async findByFuente(fuente: FuenteIngesta): Promise<EjecucionIngesta[]> {
    const entities = await this.em.find(
      EjecucionIngestaEntity,
      { fuente },
      { orderBy: { inicio: 'DESC' } },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findAll(): Promise<EjecucionIngesta[]> {
    const entities = await this.em.find(
      EjecucionIngestaEntity,
      {},
      { orderBy: { inicio: 'DESC' } },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async save(ejecucion: EjecucionIngesta): Promise<void> {
    const data = this.mapper.toPersistence(ejecucion);
    const existing = await this.em.findOne(EjecucionIngestaEntity, { id: data.id });

    if (existing) {
      existing.fuente = data.fuente;
      existing.estado = data.estado;
      existing.disparador = data.disparador;
      existing.disparadoPor = data.disparadoPor;
      existing.ingestaId = data.ingestaId;
      existing.inicio = data.inicio;
      existing.fin = data.fin;
      existing.reglasNuevas = data.reglasNuevas;
      existing.reglasModificadas = data.reglasModificadas;
      existing.errores = data.errores;
      existing.updatedAt = new Date();
    } else {
      this.em.create(EjecucionIngestaEntity, {
        id: data.id,
        fuente: data.fuente,
        estado: data.estado,
        disparador: data.disparador,
        disparadoPor: data.disparadoPor,
        ingestaId: data.ingestaId,
        inicio: data.inicio,
        fin: data.fin,
        reglasNuevas: data.reglasNuevas,
        reglasModificadas: data.reglasModificadas,
        errores: data.errores,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await this.em.flush();
  }
}
