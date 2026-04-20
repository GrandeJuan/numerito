import { EntityManager } from '@mikro-orm/core';

export interface EjecucionIngestaItem {
  id: string;
  fuente: string;
  estado: string;
  disparador: string;
  disparadoPor: string | null;
  inicio: string;
  fin: string | null;
  reglasNuevas: number;
  reglasModificadas: number;
  errores: string[];
}

export class EjecucionIngestaListHandler {
  constructor(private readonly em: EntityManager) {}

  async execute(filters?: { fuente?: string; estado?: string }): Promise<EjecucionIngestaItem[]> {
    let sql = `
      SELECT id, fuente, estado, disparador,
             disparado_por AS "disparadoPor",
             inicio, fin,
             reglas_nuevas AS "reglasNuevas",
             reglas_modificadas AS "reglasModificadas",
             errores
      FROM ejecucion_ingesta
    `;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (filters?.fuente) {
      conditions.push(`fuente = $${paramIdx++}`);
      params.push(filters.fuente);
    }
    if (filters?.estado) {
      conditions.push(`estado = $${paramIdx++}`);
      params.push(filters.estado);
    }
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    sql += ' ORDER BY inicio DESC LIMIT 100';

    return this.em.getConnection().execute(sql, params);
  }
}
