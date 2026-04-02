import { EntitySchema } from '@mikro-orm/core';
import { CondicionIvaEntity } from '../../../shared/infrastructure/persistence/condicion-iva.schema';
import { TipoClienteEntity } from '../../../shared/infrastructure/persistence/tipo-cliente.schema';
import { RegimenEntity } from '../../../shared/infrastructure/persistence/regimen.schema';
import { EstudioEntity } from '../../../tenant/infrastructure/persistence/estudio.schema';
import { UsuarioEntity } from '../../../iam/infrastructure/persistence/usuario.schema';

export class ClienteEntity {
  id!: string;
  cuit!: string;
  razonSocial!: string;
  condicionIva!: CondicionIvaEntity;
  tipoCliente!: TipoClienteEntity;
  regimen!: RegimenEntity;
  tenant!: EstudioEntity;
  responsable?: UsuarioEntity;
  isActive!: boolean;
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
    tenant: { kind: 'm:1', entity: () => EstudioEntity, fieldName: 'tenant_id' },
    responsable: { kind: 'm:1', entity: () => UsuarioEntity, fieldName: 'responsable_id', nullable: true },
    isActive: { type: 'boolean', fieldName: 'is_active', default: true },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
  indexes: [
    { properties: ['tenant'] },
    { properties: ['cuit', 'tenant'], unique: true },
    { properties: ['responsable'] },
  ],
});
