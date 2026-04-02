import { EntitySchema } from '@mikro-orm/core';
import { FacturaEntity } from './factura.schema';

export class LineaFacturaEntity {
  id!: string;
  factura!: FacturaEntity;
  descripcion!: string;
  cantidad!: number;
  precioUnitario!: number;
  alicuotaIva!: number;
  subtotal!: number;
}

export const LineaFacturaSchema = new EntitySchema<LineaFacturaEntity>({
  class: LineaFacturaEntity,
  tableName: 'linea_factura',
  properties: {
    id: { type: 'uuid', primary: true },
    factura: { kind: 'm:1', entity: () => FacturaEntity, fieldName: 'factura_id' },
    descripcion: { type: 'string' },
    cantidad: { type: 'number', columnType: 'numeric(12,4)' },
    precioUnitario: { type: 'number', fieldName: 'precio_unitario', columnType: 'numeric(12,2)' },
    alicuotaIva: { type: 'number', fieldName: 'alicuota_iva', columnType: 'numeric(5,2)' },
    subtotal: { type: 'number', columnType: 'numeric(12,2)' },
  },
  indexes: [
    { properties: ['factura'] },
  ],
});
