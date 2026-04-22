import { EntityManager } from '@mikro-orm/core';

export interface EjecucionIngestaItem {
  id: string;
  fuente: string;
  estado: string;
  disparador: string;
  disparadoPor: string | null;
  ingestaId: string | null;
  inicio: string;
  fin: string | null;
  reglasNuevas: number;
  reglasModificadas: number;
  errores: string[];
}

/**
 * Scraper runs that sit in EN_CURSO longer than this are assumed dead
 * (container crashed, webhook never came). Marked FALLIDA on read so the
 * UI doesn't show a cronómetro that advances forever.
 */
const EJECUCION_TIMEOUT_SECONDS = 10 * 60;

export class EjecucionIngestaListHandler {
  constructor(private readonly em: EntityManager) {}

  /**
   * Mark zombie EN_CURSO rows (older than EJECUCION_TIMEOUT_SECONDS) as FALLIDA.
   * Runs on every read so the UI self-heals without a background cron.
   */
  private async expireZombies(): Promise<void> {
    await this.em.getConnection().execute(
      `UPDATE ejecucion_ingesta
         SET estado = 'FALLIDA',
             fin = NOW(),
             errores = errores || ?::jsonb,
             updated_at = NOW()
       WHERE estado = 'EN_CURSO'
         AND inicio < NOW() - INTERVAL '${EJECUCION_TIMEOUT_SECONDS} seconds'`,
      [JSON.stringify([`Timeout: sin respuesta del scraper en ${EJECUCION_TIMEOUT_SECONDS}s`])],
    );
  }

  async execute(filters?: { fuente?: string; estado?: string }): Promise<EjecucionIngestaItem[]> {
    await this.expireZombies();
    let sql = `
      SELECT id, fuente, estado, disparador,
             disparado_por AS "disparadoPor",
             ingesta_id AS "ingestaId",
             inicio, fin,
             reglas_nuevas AS "reglasNuevas",
             reglas_modificadas AS "reglasModificadas",
             errores
      FROM ejecucion_ingesta
    `;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters?.fuente) {
      conditions.push(`fuente = ?`);
      params.push(filters.fuente);
    }
    if (filters?.estado) {
      conditions.push(`estado = ?`);
      params.push(filters.estado);
    }
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    sql += ' ORDER BY inicio DESC LIMIT 100';

    return this.em.getConnection().execute(sql, params);
  }

  async byId(id: string): Promise<EjecucionIngestaItem | null> {
    await this.expireZombies();
    const rows = await this.em.getConnection().execute<EjecucionIngestaItem[]>(
      `SELECT id, fuente, estado, disparador,
              disparado_por AS "disparadoPor",
              ingesta_id AS "ingestaId",
              inicio, fin,
              reglas_nuevas AS "reglasNuevas",
              reglas_modificadas AS "reglasModificadas",
              errores
       FROM ejecucion_ingesta
       WHERE id = ?`,
      [id],
    );
    return rows[0] ?? null;
  }
}
