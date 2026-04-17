import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

export interface CargaTrabajoViewInput {
  estudioId: string;
}

export interface CargaTrabajoItemDto {
  usuario: string;
  tareas: number;
}

@Injectable()
export class CargaTrabajoView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: CargaTrabajoViewInput): Promise<CargaTrabajoItemDto[]> {
    const conn = this.em.getConnection();

    const rows = await conn.execute(
      `SELECT u.email as usuario, COUNT(*)::int as tareas
       FROM tarea t
       JOIN usuario u ON t.responsable_id = u.id
       JOIN estado_tarea et ON t.estado_id = et.id
       WHERE t.estudio_id = ?
         AND et.codigo NOT IN ('COMPLETADA', 'CANCELADA')
       GROUP BY u.email
       ORDER BY tareas DESC`,
      [input.estudioId],
    );

    return rows.map((r: any) => ({
      usuario: r.usuario as string,
      tareas: Number(r.tareas),
    }));
  }
}
