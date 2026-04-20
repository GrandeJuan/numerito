import { EntitySchema } from '@mikro-orm/core';

export class CatalogoObligacionEntity {
  id!: string;
  nombre!: string;
  tipoObligacion!: string;
  jurisdiccion!: string;
  frecuencia!: string;
  activo!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export const CatalogoObligacionSchema = new EntitySchema<CatalogoObligacionEntity>({
  class: CatalogoObligacionEntity,
  tableName: 'catalogo_obligacion',
  properties: {
    id: { type: 'uuid', primary: true },
    nombre: { type: 'string' },
    tipoObligacion: { type: 'string', fieldName: 'tipo_obligacion' },
    jurisdiccion: { type: 'string' },
    frecuencia: { type: 'string' },
    activo: { type: 'boolean', default: true },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: {
      type: 'Date',
      fieldName: 'updated_at',
      onCreate: () => new Date(),
      onUpdate: () => new Date(),
    },
  },
  uniques: [{ properties: ['tipoObligacion', 'jurisdiccion'] }],
});
