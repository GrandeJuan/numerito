import { EntitySchema } from '@mikro-orm/core';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../tenant/infrastructure/persistence/estudio.schema';
import { TipoLibroEntity } from '../../../shared/infrastructure/persistence/tipo-libro.schema';

export class LibroContableEntity {
  id!: string;
  cliente!: ClienteEntity;
  tenant!: EstudioEntity;
  tipoLibro!: TipoLibroEntity;
  periodo!: string;
  isRubricado!: boolean;
  numeroRubrica?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

export const LibroContableSchema = new EntitySchema<LibroContableEntity>({
  class: LibroContableEntity,
  tableName: 'libro_contable',
  properties: {
    id: { type: 'uuid', primary: true },
    cliente: { kind: 'm:1', entity: () => ClienteEntity, fieldName: 'cliente_id' },
    tenant: { kind: 'm:1', entity: () => EstudioEntity, fieldName: 'tenant_id' },
    tipoLibro: { kind: 'm:1', entity: () => TipoLibroEntity, fieldName: 'tipo_libro_id' },
    periodo: { type: 'string', length: 7 },
    isRubricado: { type: 'boolean', fieldName: 'is_rubricado', default: false },
    numeroRubrica: { type: 'string', fieldName: 'numero_rubrica', nullable: true },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
  indexes: [
    { properties: ['tenant'] },
    { properties: ['cliente'] },
    { properties: ['cliente', 'tipoLibro', 'periodo'], unique: true },
  ],
});
