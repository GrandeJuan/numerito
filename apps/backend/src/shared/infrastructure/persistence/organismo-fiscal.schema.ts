import { EntitySchema } from '@mikro-orm/core';

export class OrganismoFiscalEntity {
  id!: number;
  codigo!: string;
  nombre!: string;
  jurisdiccion!: string;
  urlPortal!: string;
  requiereScraping!: boolean;
  tieneWebService!: boolean;
  activo!: boolean;
}

export const OrganismoFiscalSchema = new EntitySchema<OrganismoFiscalEntity>({
  class: OrganismoFiscalEntity,
  tableName: 'organismo_fiscal',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    codigo: { type: 'string', unique: true },
    nombre: { type: 'string' },
    jurisdiccion: { type: 'string' },
    urlPortal: { type: 'string', fieldName: 'url_portal' },
    requiereScraping: { type: 'boolean', fieldName: 'requiere_scraping' },
    tieneWebService: { type: 'boolean', fieldName: 'tiene_web_service' },
    activo: { type: 'boolean', default: true },
  },
});
