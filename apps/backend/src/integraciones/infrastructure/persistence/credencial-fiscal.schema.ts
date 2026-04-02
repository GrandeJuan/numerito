import { EntitySchema } from '@mikro-orm/core';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';
import { OrganismoFiscalEntity } from '../../../shared/infrastructure/persistence/organismo-fiscal.schema';

export class CredencialFiscalEntity {
  id!: string;
  cliente!: ClienteEntity;
  estudio!: EstudioEntity;
  organismo!: OrganismoFiscalEntity;
  cuit!: string;
  secretArn!: string;
  ultimaSincronizacion?: Date;
  estado!: string;
  createdAt!: Date;
  updatedAt!: Date;
}

export const CredencialFiscalSchema = new EntitySchema<CredencialFiscalEntity>({
  class: CredencialFiscalEntity,
  tableName: 'credencial_fiscal',
  properties: {
    id: { type: 'uuid', primary: true },
    cliente: { kind: 'm:1', entity: () => ClienteEntity, fieldName: 'cliente_id' },
    estudio: { kind: 'm:1', entity: () => EstudioEntity, fieldName: 'estudio_id' },
    organismo: { kind: 'm:1', entity: () => OrganismoFiscalEntity, fieldName: 'organismo_id' },
    cuit: { type: 'string', length: 13 },
    secretArn: { type: 'string', fieldName: 'secret_arn' },
    ultimaSincronizacion: { type: 'Date', fieldName: 'ultima_sincronizacion', nullable: true },
    estado: { type: 'string', length: 20 },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
  indexes: [
    { properties: ['estudio'] },
    { properties: ['cliente'] },
  ],
});
