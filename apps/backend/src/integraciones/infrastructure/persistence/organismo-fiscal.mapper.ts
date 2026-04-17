import { z } from 'zod';
import type { Mapper } from '../../../shared/domain';
import type { OrganismoFiscalData } from '../../domain/repositories/organismo-fiscal.repository';
import type { OrganismoFiscalEntity } from '../../../shared/infrastructure/persistence/organismo-fiscal.schema';

export const organismoFiscalPersistenceSchema = z.object({
  id: z.string(),
  codigo: z.string().min(1),
  nombre: z.string().min(1),
  jurisdiccion: z.string(),
  urlPortal: z.string().optional(),
  requiereScraping: z.boolean(),
  tieneWebService: z.boolean(),
  activo: z.boolean(),
});

export type OrganismoFiscalPersistence = z.infer<typeof organismoFiscalPersistenceSchema>;

export class OrganismoFiscalMapper implements Mapper<OrganismoFiscalData, OrganismoFiscalPersistence> {
  toDomain(persistence: OrganismoFiscalPersistence): OrganismoFiscalData {
    const data = organismoFiscalPersistenceSchema.parse(persistence);
    return {
      id: data.id,
      codigo: data.codigo,
      nombre: data.nombre,
      jurisdiccion: data.jurisdiccion,
      urlPortal: data.urlPortal,
      requiereScraping: data.requiereScraping,
      tieneWebService: data.tieneWebService,
      activo: data.activo,
    };
  }

  toPersistence(domain: OrganismoFiscalData): OrganismoFiscalPersistence {
    return {
      id: domain.id,
      codigo: domain.codigo,
      nombre: domain.nombre,
      jurisdiccion: domain.jurisdiccion,
      urlPortal: domain.urlPortal,
      requiereScraping: domain.requiereScraping,
      tieneWebService: domain.tieneWebService,
      activo: domain.activo,
    };
  }

  fromSchema(entity: OrganismoFiscalEntity): OrganismoFiscalPersistence {
    return {
      id: String(entity.id),
      codigo: entity.codigo,
      nombre: entity.nombre,
      jurisdiccion: entity.jurisdiccion,
      urlPortal: entity.urlPortal || undefined,
      requiereScraping: entity.requiereScraping,
      tieneWebService: entity.tieneWebService,
      activo: entity.activo,
    };
  }
}
