import { EntitySchema } from '@mikro-orm/core';

export class DiaFeriadoEntity {
  id!: string;
  fecha!: Date;
  tipo!: string;
  descripcion!: string;
  jurisdiccionAfectada!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}

export const DiaFeriadoSchema = new EntitySchema<DiaFeriadoEntity>({
  class: DiaFeriadoEntity,
  tableName: 'dia_feriado',
  properties: {
    id: { type: 'uuid', primary: true },
    fecha: { type: 'Date' },
    tipo: { type: 'string' },
    descripcion: { type: 'string' },
    jurisdiccionAfectada: { type: 'string', fieldName: 'jurisdiccion_afectada', nullable: true },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: {
      type: 'Date',
      fieldName: 'updated_at',
      onCreate: () => new Date(),
      onUpdate: () => new Date(),
    },
  },
  indexes: [
    { properties: ['fecha'] },
    { properties: ['tipo'] },
    { properties: ['fecha', 'tipo'], name: 'idx_dia_feriado_fecha_tipo' },
  ],
  uniques: [
    { properties: ['fecha', 'tipo', 'jurisdiccionAfectada'], name: 'uq_dia_feriado_fecha_tipo_jurisdiccion' },
  ],
});
