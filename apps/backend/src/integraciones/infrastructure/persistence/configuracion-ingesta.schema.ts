import { EntitySchema } from '@mikro-orm/core';

export class ConfiguracionIngestaEntity {
  id!: string;
  fuente!: string;
  habilitado!: boolean;
  cadenciaDias!: number;
  proximaEjecucion!: Date | null;
  ultimaEjecucion!: Date | null;
  ultimoResultado!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}

export const ConfiguracionIngestaSchema = new EntitySchema<ConfiguracionIngestaEntity>({
  class: ConfiguracionIngestaEntity,
  tableName: 'configuracion_ingesta',
  properties: {
    id: { type: 'uuid', primary: true },
    fuente: { type: 'string', unique: true },
    habilitado: { type: 'boolean', default: false },
    cadenciaDias: { type: 'number', fieldName: 'cadencia_dias' },
    proximaEjecucion: { type: 'Date', fieldName: 'proxima_ejecucion', nullable: true },
    ultimaEjecucion: { type: 'Date', fieldName: 'ultima_ejecucion', nullable: true },
    ultimoResultado: { type: 'string', fieldName: 'ultimo_resultado', nullable: true },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: {
      type: 'Date',
      fieldName: 'updated_at',
      onCreate: () => new Date(),
      onUpdate: () => new Date(),
    },
  },
});
