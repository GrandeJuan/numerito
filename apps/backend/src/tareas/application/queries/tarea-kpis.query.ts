import { EntityManager } from '@mikro-orm/core';

export interface TareaKpisQuery {
  estudioId: string;
}

export interface TareaKpisResult {
  pendientes: number;
  enProgreso: number;
  completadas: number;
  totalHoras: number;
}

export class TareaKpisHandler {
  constructor(private readonly em: EntityManager) {}

  async execute(query: TareaKpisQuery): Promise<TareaKpisResult> {
    const conn = this.em.getConnection();
    const [row] = await conn.execute(
      `SELECT
         COUNT(*) FILTER (WHERE et.codigo = 'PENDIENTE') AS pendientes,
         COUNT(*) FILTER (WHERE et.codigo = 'EN_PROGRESO') AS en_progreso,
         COUNT(*) FILTER (WHERE et.codigo = 'COMPLETADO') AS completadas,
         COALESCE(SUM(t.horas_registradas), 0) AS total_horas
       FROM tarea t
       JOIN estado_tarea et ON t.estado_id = et.id
       WHERE t.estudio_id = ?`,
      [query.estudioId],
    );

    return {
      pendientes: Number(row?.pendientes ?? 0),
      enProgreso: Number(row?.en_progreso ?? 0),
      completadas: Number(row?.completadas ?? 0),
      totalHoras: Number(row?.total_horas ?? 0),
    };
  }
}
