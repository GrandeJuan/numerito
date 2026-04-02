import { EntitySchema } from '@mikro-orm/core';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../tenant/infrastructure/persistence/estudio.schema';
import { EstadoTareaEntity } from '../../../shared/infrastructure/persistence/estado-tarea.schema';
import { PrioridadEntity } from '../../../shared/infrastructure/persistence/prioridad.schema';
import { UsuarioEntity } from '../../../iam/infrastructure/persistence/usuario.schema';

export interface ComentarioDto {
  usuarioId: string;
  texto: string;
  fecha: string;
}

export class TareaEntity {
  id!: string;
  titulo!: string;
  descripcion?: string;
  cliente?: ClienteEntity;
  tenant!: EstudioEntity;
  estado!: EstadoTareaEntity;
  prioridad!: PrioridadEntity;
  responsable?: UsuarioEntity;
  horasRegistradas!: number;
  comentarios!: ComentarioDto[];
  createdAt!: Date;
  updatedAt!: Date;
}

export const TareaSchema = new EntitySchema<TareaEntity>({
  class: TareaEntity,
  tableName: 'tarea',
  properties: {
    id: { type: 'uuid', primary: true },
    titulo: { type: 'string' },
    descripcion: { type: 'string', nullable: true },
    cliente: { kind: 'm:1', entity: () => ClienteEntity, fieldName: 'cliente_id', nullable: true },
    tenant: { kind: 'm:1', entity: () => EstudioEntity, fieldName: 'tenant_id' },
    estado: { kind: 'm:1', entity: () => EstadoTareaEntity, fieldName: 'estado_id' },
    prioridad: { kind: 'm:1', entity: () => PrioridadEntity, fieldName: 'prioridad_id' },
    responsable: { kind: 'm:1', entity: () => UsuarioEntity, fieldName: 'responsable_id', nullable: true },
    horasRegistradas: { type: 'number', fieldName: 'horas_registradas', columnType: 'numeric(8,2)', default: 0 },
    comentarios: { type: 'json', default: '[]' },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
  indexes: [
    { properties: ['tenant'] },
    { properties: ['cliente'] },
    { properties: ['responsable'] },
    { properties: ['tenant', 'estado'] },
  ],
});
