import { EntitySchema } from '@mikro-orm/core';
import { LibroContableEntity } from './libro-contable.schema';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';

export interface LineaAsientoDto {
  cuentaId: string;
  debe: number;
  haber: number;
  descripcion: string;
}

export class AsientoContableEntity {
  id!: string;
  libro!: LibroContableEntity;
  cliente!: ClienteEntity;
  estudio!: EstudioEntity;
  fecha!: Date;
  descripcion!: string;
  lineas!: LineaAsientoDto[];
  createdAt!: Date;
  updatedAt!: Date;
}

export const AsientoContableSchema = new EntitySchema<AsientoContableEntity>({
  class: AsientoContableEntity,
  tableName: 'asiento_contable',
  properties: {
    id: { type: 'uuid', primary: true },
    libro: { kind: 'm:1', entity: () => LibroContableEntity, fieldName: 'libro_id' },
    cliente: { kind: 'm:1', entity: () => ClienteEntity, fieldName: 'cliente_id' },
    estudio: { kind: 'm:1', entity: () => EstudioEntity, fieldName: 'estudio_id' },
    fecha: { type: 'Date' },
    descripcion: { type: 'string' },
    lineas: { type: 'json' },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
  indexes: [
    { properties: ['estudio'] },
    { properties: ['cliente'] },
    { properties: ['libro'] },
    { properties: ['fecha'] },
  ],
});
