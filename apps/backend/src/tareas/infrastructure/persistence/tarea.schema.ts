import { EntitySchema } from '@mikro-orm/core';

export interface ComentarioDto {
  usuarioId: string;
  texto: string;
  fecha: string;
}

export class TareaEntity {
  id!: string;
  titulo!: string;
  descripcion?: string;
  clienteId?: string;
  tenantId!: string;
  estado!: string;
  prioridad!: string;
  responsableId?: string;
  horasRegistradas!: number;
  comentarios!: ComentarioDto[];
  createdAt!: Date;
  updatedAt!: Date;
}

export const TareaSchema = new EntitySchema<TareaEntity>({
  class: TareaEntity,
  tableName: 'tareas',
  properties: {
    id: { type: 'uuid', primary: true },
    titulo: { type: 'string' },
    descripcion: { type: 'string', nullable: true },
    clienteId: { type: 'uuid', fieldName: 'cliente_id', nullable: true },
    tenantId: { type: 'uuid', fieldName: 'tenant_id' },
    estado: { type: 'string', length: 20, default: 'PENDIENTE' },
    prioridad: { type: 'string', length: 20 },
    responsableId: { type: 'uuid', fieldName: 'responsable_id', nullable: true },
    horasRegistradas: { type: 'number', fieldName: 'horas_registradas', columnType: 'numeric(8,2)', default: 0 },
    comentarios: { type: 'json', default: '[]' },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
  indexes: [
    { properties: ['tenantId'] },
    { properties: ['clienteId'] },
    { properties: ['responsableId'] },
    { properties: ['tenantId', 'estado'] },
  ],
});
