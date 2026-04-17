import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { GlobalRepository } from '../../../shared/domain';
import type {
  OrganismoFiscalRepository,
  OrganismoFiscalData,
} from '../../domain/repositories/organismo-fiscal.repository';
import { OrganismoFiscalEntity } from '../../../shared/infrastructure/persistence/organismo-fiscal.schema';
import { OrganismoFiscalMapper } from './organismo-fiscal.mapper';

@Injectable()
export class MikroOrmOrganismoFiscalRepository
  extends GlobalRepository<OrganismoFiscalData>
  implements OrganismoFiscalRepository
{
  private readonly mapper = new OrganismoFiscalMapper();

  constructor(private readonly em: EntityManager) {
    super();
  }

  async findById(_id: string): Promise<OrganismoFiscalData | null> {
    throw new Error('Not implemented');
  }

  async delete(_entity: OrganismoFiscalData): Promise<void> {
    throw new Error('Not implemented');
  }

  async findByCodigo(codigo: string): Promise<OrganismoFiscalData | null> {
    const entity = await this.em.findOne(OrganismoFiscalEntity, { codigo });
    if (!entity) return null;
    return this.mapper.toDomain(this.mapper.fromSchema(entity));
  }

  async findAll(): Promise<OrganismoFiscalData[]> {
    const entities = await this.em.findAll(OrganismoFiscalEntity);
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findActivos(): Promise<OrganismoFiscalData[]> {
    const entities = await this.em.find(OrganismoFiscalEntity, { activo: true });
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async save(organismo: OrganismoFiscalData): Promise<void> {
    const existing = await this.em.findOne(OrganismoFiscalEntity, { id: Number(organismo.id) });
    if (existing) {
      existing.codigo = organismo.codigo;
      existing.nombre = organismo.nombre;
      existing.jurisdiccion = organismo.jurisdiccion;
      existing.urlPortal = organismo.urlPortal ?? '';
      existing.requiereScraping = organismo.requiereScraping;
      existing.tieneWebService = organismo.tieneWebService;
      existing.activo = organismo.activo;
    } else {
      this.em.create(OrganismoFiscalEntity, {
        codigo: organismo.codigo,
        nombre: organismo.nombre,
        jurisdiccion: organismo.jurisdiccion,
        urlPortal: organismo.urlPortal ?? '',
        requiereScraping: organismo.requiereScraping,
        tieneWebService: organismo.tieneWebService,
        activo: organismo.activo,
      });
    }
    await this.em.flush();
  }
}
