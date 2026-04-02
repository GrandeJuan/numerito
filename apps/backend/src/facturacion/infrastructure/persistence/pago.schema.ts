import { EntitySchema } from '@mikro-orm/core';
import { FacturaEntity } from './factura.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';
import { MedioPagoEntity } from '../../../shared/infrastructure/persistence/medio-pago.schema';

export class PagoEntity {
  id!: string;
  factura!: FacturaEntity;
  estudio!: EstudioEntity;
  fecha!: Date;
  monto!: number;
  medioPago!: MedioPagoEntity;
  referencia?: string;
  createdAt!: Date;
}

export const PagoSchema = new EntitySchema<PagoEntity>({
  class: PagoEntity,
  tableName: 'pago',
  properties: {
    id: { type: 'uuid', primary: true },
    factura: { kind: 'm:1', entity: () => FacturaEntity, fieldName: 'factura_id' },
    estudio: { kind: 'm:1', entity: () => EstudioEntity, fieldName: 'estudio_id' },
    fecha: { type: 'Date' },
    monto: { type: 'number', columnType: 'numeric(12,2)' },
    medioPago: { kind: 'm:1', entity: () => MedioPagoEntity, fieldName: 'medio_pago_id' },
    referencia: { type: 'string', nullable: true },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
  },
  indexes: [
    { properties: ['factura'] },
    { properties: ['estudio'] },
  ],
});
