import { EntitySchema } from '@mikro-orm/core';

export class EjecucionIngestaEntity {
  id!: string;
  fuente!: string;
  estado!: string;
  disparador!: string;
  disparadoPor!: string | null;
  ingestaId!: string | null;
  inicio!: Date;
  fin!: Date | null;
  reglasNuevas!: number;
  reglasModificadas!: number;
  errores!: string[];
  createdAt!: Date;
  updatedAt!: Date;
}

export const EjecucionIngestaSchema = new EntitySchema<EjecucionIngestaEntity>({
  class: EjecucionIngestaEntity,
  tableName: 'ejecucion_ingesta',
  properties: {
    id: { type: 'uuid', primary: true },
    fuente: { type: 'string' },
    estado: { type: 'string', default: 'EN_CURSO' },
    disparador: { type: 'string' },
    disparadoPor: { type: 'string', fieldName: 'disparado_por', nullable: true },
    ingestaId: { type: 'string', fieldName: 'ingesta_id', nullable: true },
    inicio: { type: 'Date' },
    fin: { type: 'Date', nullable: true },
    reglasNuevas: { type: 'number', fieldName: 'reglas_nuevas', default: 0 },
    reglasModificadas: { type: 'number', fieldName: 'reglas_modificadas', default: 0 },
    errores: { type: 'json', default: '[]' },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: {
      type: 'Date',
      fieldName: 'updated_at',
      onCreate: () => new Date(),
      onUpdate: () => new Date(),
    },
  },
  indexes: [
    { properties: ['fuente'] },
    { properties: ['estado'] },
    { properties: ['inicio'] },
  ],
  uniques: [
    { properties: ['ingestaId'], options: { where: 'ingesta_id IS NOT NULL' } },
  ],
});
