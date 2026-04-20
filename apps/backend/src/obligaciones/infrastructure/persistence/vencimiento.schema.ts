import { EntitySchema } from '@mikro-orm/core';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';
import { TipoObligacionEntity } from '../../../shared/infrastructure/persistence/tipo-obligacion.schema';
import { EstadoVencimientoEntity } from '../../../shared/infrastructure/persistence/estado-vencimiento.schema';

export class VencimientoEntity {
  id!: string;
  cliente!: ClienteEntity;
  estudio!: EstudioEntity;
  tipoObligacion!: TipoObligacionEntity;
  periodo!: string;
  fechaVencimiento!: Date;
  fechaNominal!: Date | null;
  descripcion!: string;
  estado!: EstadoVencimientoEntity;
  motivo!: string | null;
  fechaProrrogada!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
}

export const VencimientoSchema = new EntitySchema<VencimientoEntity>({
  class: VencimientoEntity,
  tableName: 'vencimiento',
  properties: {
    id: { type: 'uuid', primary: true },
    cliente: { kind: 'm:1', entity: () => ClienteEntity, fieldName: 'cliente_id' },
    estudio: { kind: 'm:1', entity: () => EstudioEntity, fieldName: 'estudio_id' },
    tipoObligacion: { kind: 'm:1', entity: () => TipoObligacionEntity, fieldName: 'tipo_obligacion_id' },
    periodo: { type: 'string', length: 7 },
    fechaVencimiento: { type: 'Date', fieldName: 'fecha_vencimiento' },
    fechaNominal: { type: 'Date', fieldName: 'fecha_nominal', nullable: true },
    descripcion: { type: 'string' },
    estado: { kind: 'm:1', entity: () => EstadoVencimientoEntity, fieldName: 'estado_id' },
    motivo: { type: 'string', nullable: true },
    fechaProrrogada: { type: 'Date', fieldName: 'fecha_prorrogada', nullable: true },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
  indexes: [
    { properties: ['estudio'] },
    { properties: ['cliente'] },
    { properties: ['fechaVencimiento'] },
    { properties: ['estudio', 'estado'] },
  ],
});
