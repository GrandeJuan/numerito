import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

export interface ActividadRecienteVencimientosViewInput {
  estudioId: string;
  limite?: number;
}

export interface ActividadRecienteVencimientoDto {
  tipo: 'vencimiento';
  descripcion: string;
  fecha: string;
}

@Injectable()
export class ActividadRecienteVencimientosView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: ActividadRecienteVencimientosViewInput): Promise<ActividadRecienteVencimientoDto[]> {
    const limite = input.limite ?? 5;
    const conn = this.em.getConnection();

    const rows = await conn.execute(
      `SELECT
         CONCAT('Vencimiento de ', c.razon_social) as descripcion,
         v.updated_at::text as fecha
       FROM vencimiento v
       JOIN cliente c ON v.cliente_id = c.id
       WHERE v.estudio_id = ?
       ORDER BY v.updated_at DESC
       LIMIT ?`,
      [input.estudioId, limite],
    );

    return rows.map((r: any) => ({
      tipo: 'vencimiento' as const,
      descripcion: r.descripcion as string,
      fecha: r.fecha as string,
    }));
  }
}
