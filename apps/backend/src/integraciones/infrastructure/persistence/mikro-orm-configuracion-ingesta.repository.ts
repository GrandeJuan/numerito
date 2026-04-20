import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { GlobalRepository } from '../../../shared/domain';
import type { ConfiguracionIngestaRepository } from '../../domain/repositories/configuracion-ingesta.repository';
import { ConfiguracionIngesta } from '../../domain/entities/configuracion-ingesta.entity';
import { ConfiguracionIngestaEntity } from './configuracion-ingesta.schema';
import { ConfiguracionIngestaMapper } from './configuracion-ingesta.mapper';

@Injectable()
export class MikroOrmConfiguracionIngestaRepository
  extends GlobalRepository<ConfiguracionIngesta>
  implements ConfiguracionIngestaRepository
{
  private readonly mapper = new ConfiguracionIngestaMapper();

  constructor(private readonly em: EntityManager) {
    super();
  }

  async findById(id: string): Promise<ConfiguracionIngesta | null> {
    const entity = await this.em.findOne(ConfiguracionIngestaEntity, { id });
    if (!entity) return null;
    return this.mapper.toDomain(this.mapper.fromSchema(entity));
  }

  async findByFuente(fuente: string): Promise<ConfiguracionIngesta | null> {
    const entity = await this.em.findOne(ConfiguracionIngestaEntity, { fuente });
    if (!entity) return null;
    return this.mapper.toDomain(this.mapper.fromSchema(entity));
  }

  async findAll(): Promise<ConfiguracionIngesta[]> {
    const entities = await this.em.find(ConfiguracionIngestaEntity, {});
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async save(config: ConfiguracionIngesta): Promise<void> {
    const data = this.mapper.toPersistence(config);
    const existing = await this.em.findOne(ConfiguracionIngestaEntity, { id: data.id });

    if (existing) {
      existing.fuente = data.fuente;
      existing.habilitado = data.habilitado;
      existing.cadenciaDias = data.cadenciaDias;
      existing.proximaEjecucion = data.proximaEjecucion;
      existing.ultimaEjecucion = data.ultimaEjecucion;
      existing.ultimoResultado = data.ultimoResultado;
      existing.updatedAt = new Date();
    } else {
      this.em.create(ConfiguracionIngestaEntity, {
        id: data.id,
        fuente: data.fuente,
        habilitado: data.habilitado,
        cadenciaDias: data.cadenciaDias,
        proximaEjecucion: data.proximaEjecucion,
        ultimaEjecucion: data.ultimaEjecucion,
        ultimoResultado: data.ultimoResultado,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await this.em.flush();
  }

  async delete(config: ConfiguracionIngesta): Promise<void> {
    const entity = await this.em.findOne(ConfiguracionIngestaEntity, { id: config.id });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }
}
