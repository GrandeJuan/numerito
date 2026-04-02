import { EntitySchema } from '@mikro-orm/core';

export class PlanEntity {
  id!: number;
  codigo!: string;
  nombre!: string;
  descripcion?: string;
  maxClientes!: number;
  maxUsuarios!: number;
  precio!: number;
  isPublico!: boolean;
  isActivo!: boolean;
  condiciones?: Record<string, unknown>;
}

export const PlanSchema = new EntitySchema<PlanEntity>({
  class: PlanEntity,
  tableName: 'plan',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    codigo: { type: 'string', unique: true },
    nombre: { type: 'string' },
    descripcion: { type: 'string', nullable: true },
    maxClientes: { type: 'number', fieldName: 'max_clientes', columnType: 'int' },
    maxUsuarios: { type: 'number', fieldName: 'max_usuarios', columnType: 'int' },
    precio: { type: 'number', columnType: 'numeric(10,2)' },
    isPublico: { type: 'boolean', fieldName: 'is_publico', default: true },
    isActivo: { type: 'boolean', fieldName: 'is_activo', default: true },
    condiciones: { type: 'json', nullable: true },
  },
});
