import { EntitySchema } from '@mikro-orm/core';
import { CondicionIvaEntity } from '../../../shared/infrastructure/persistence/condicion-iva.schema';
import { TipoClienteEntity } from '../../../shared/infrastructure/persistence/tipo-cliente.schema';
import { RegimenEntity } from '../../../shared/infrastructure/persistence/regimen.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';
import { UsuarioEntity } from '../../../iam/infrastructure/persistence/usuario.schema';

export class ClienteEntity {
  id!: string;
  cuit!: string;
  razonSocial!: string;
  condicionIva!: CondicionIvaEntity;
  tipoCliente!: TipoClienteEntity;
  regimen!: RegimenEntity;
  estudio!: EstudioEntity;
  responsable?: UsuarioEntity;
  isActive!: boolean;
  inscripciones!: Record<string, unknown>[];
  createdAt!: Date;
  updatedAt!: Date;
}

export const ClienteSchema = new EntitySchema<ClienteEntity>({
  class: ClienteEntity,
  tableName: 'cliente',
  properties: {
    id: { type: 'uuid', primary: true },
    cuit: { type: 'string', length: 13 },
    razonSocial: { type: 'string', fieldName: 'razon_social' },
    condicionIva: { kind: 'm:1', entity: () => CondicionIvaEntity, fieldName: 'condicion_iva_id' },
    tipoCliente: { kind: 'm:1', entity: () => TipoClienteEntity, fieldName: 'tipo_cliente_id' },
    regimen: { kind: 'm:1', entity: () => RegimenEntity, fieldName: 'regimen_id' },
    estudio: { kind: 'm:1', entity: () => EstudioEntity, fieldName: 'estudio_id' },
    responsable: { kind: 'm:1', entity: () => UsuarioEntity, fieldName: 'responsable_id', nullable: true },
    isActive: { type: 'boolean', fieldName: 'is_active', default: true },
    inscripciones: { type: 'json', default: '[]' },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
  uniques: [
    { properties: ['cuit', 'estudio'] },
  ],
  indexes: [
    { properties: ['estudio'] },
    { properties: ['responsable'] },
  ],
});
