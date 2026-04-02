import { EntitySchema } from '@mikro-orm/core';

export class NotificacionFiscalEntity {
  id!: string;
  clienteId!: string;
  tenantId!: string;
  organismoId!: string;
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
  tableName: 'notificaciones_fiscales',
  properties: {
    id: { type: 'uuid', primary: true },
    clienteId: { type: 'uuid', fieldName: 'cliente_id' },
    tenantId: { type: 'uuid', fieldName: 'tenant_id' },
    organismoId: { type: 'string', fieldName: 'organismo_id', length: 50 },
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
    { properties: ['tenantId'] },
    { properties: ['clienteId'] },
    { properties: ['tenantId', 'estado'] },
    { properties: ['fechaNotificacion'] },
  ],
});
