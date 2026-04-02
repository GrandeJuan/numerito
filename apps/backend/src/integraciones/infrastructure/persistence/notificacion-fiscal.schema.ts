import { EntitySchema } from '@mikro-orm/core';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../tenant/infrastructure/persistence/estudio.schema';
import { OrganismoFiscalEntity } from '../../../shared/infrastructure/persistence/organismo-fiscal.schema';

export class NotificacionFiscalEntity {
  id!: string;
  cliente!: ClienteEntity;
  tenant!: EstudioEntity;
  organismo!: OrganismoFiscalEntity;
  cuitCliente!: string;
  asunto!: string;
  contenido!: string;
  fechaNotificacion!: Date;
  estado!: string;
  notaGestion?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

export const NotificacionFiscalSchema = new EntitySchema<NotificacionFiscalEntity>({
  class: NotificacionFiscalEntity,
  tableName: 'notificacion_fiscal',
  properties: {
    id: { type: 'uuid', primary: true },
    cliente: { kind: 'm:1', entity: () => ClienteEntity, fieldName: 'cliente_id' },
    tenant: { kind: 'm:1', entity: () => EstudioEntity, fieldName: 'tenant_id' },
    organismo: { kind: 'm:1', entity: () => OrganismoFiscalEntity, fieldName: 'organismo_id' },
    cuitCliente: { type: 'string', fieldName: 'cuit_cliente', length: 13 },
    asunto: { type: 'string' },
    contenido: { type: 'text' },
    fechaNotificacion: { type: 'Date', fieldName: 'fecha_notificacion' },
    estado: { type: 'string', length: 20, default: 'PENDIENTE' },
    notaGestion: { type: 'string', fieldName: 'nota_gestion', nullable: true },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
  indexes: [
    { properties: ['tenant'] },
    { properties: ['cliente'] },
    { properties: ['tenant', 'estado'] },
    { properties: ['fechaNotificacion'] },
  ],
});
