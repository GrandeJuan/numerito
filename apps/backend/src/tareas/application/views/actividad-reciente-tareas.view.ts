import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

export interface ActividadRecienteTareasViewInput {
  estudioId: string;
  responsableId?: string;
  limite?: number;
}

export interface ActividadRecienteTareaDto {
  tipo: 'tarea';
  descripcion: string;
  fecha: string;
  usuario?: string;
}

@Injectable()
export class ActividadRecienteTareasView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: ActividadRecienteTareasViewInput): Promise<ActividadRecienteTareaDto[]> {
    const limite = input.limite ?? 5;
    const conn = this.em.getConnection();

    const params: any[] = [input.estudioId];
    let responsableFilter = '';
    if (input.responsableId) {
      responsableFilter = `AND (t.responsable_id = ? OR c.responsable_id = ?)`;
      params.push(input.responsableId, input.responsableId);
    }
    params.push(limite);

    const rows = await conn.execute(
      `SELECT
         CONCAT('Tarea "', t.titulo, '" actualizada') as descripcion,
         t.updated_at::text as fecha,
         u.email as usuario
       FROM tarea t
       LEFT JOIN usuario u ON t.responsable_id = u.id
       LEFT JOIN cliente c ON t.cliente_id = c.id
       WHERE t.estudio_id = ? ${responsableFilter}
       ORDER BY t.updated_at DESC
       LIMIT ?`,
      params,
    );

    return rows.map((r: any) => ({
      tipo: 'tarea' as const,
      descripcion: r.descripcion as string,
      fecha: r.fecha as string,
      ...(r.usuario ? { usuario: r.usuario as string } : {}),
    }));
  }
}
