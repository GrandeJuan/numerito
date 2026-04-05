import { EntitySchema } from '@mikro-orm/core';

export class NotificacionEntity {
  id!: string;
  usuarioId!: string;
  estudioId!: string;
  tipo!: string;
  mensaje!: string;
  leida!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export const NotificacionSchema = new EntitySchema<NotificacionEntity>({
  class: NotificacionEntity,
  tableName: 'notificacion',
  properties: {
    id: { type: 'uuid', primary: true },
    usuarioId: { type: 'uuid', fieldName: 'usuario_id' },
    estudioId: { type: 'uuid', fieldName: 'estudio_id', nullable: true },
    tipo: { type: 'string', length: 50 },
    mensaje: { type: 'string', length: 500 },
    leida: { type: 'boolean', default: false },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
});
