import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

export interface VencimientosPorEstadoViewInput {
  estudioId: string;
  mesesAtras?: number;
}

export interface VencimientoPorEstadoDto {
  estado: string;
  cantidad: number;
}

@Injectable()
export class VencimientosPorEstadoView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: VencimientosPorEstadoViewInput): Promise<VencimientoPorEstadoDto[]> {
    const meses = input.mesesAtras ?? 6;
    const conn = this.em.getConnection();

    const rows = await conn.execute(
      `SELECT ev.nombre as estado, COUNT(*)::int as cantidad
       FROM vencimiento v
       JOIN estado_vencimiento ev ON v.estado_id = ev.id
       WHERE v.estudio_id = ?
         AND v.fecha_vencimiento >= NOW() - MAKE_INTERVAL(months => ?)
       GROUP BY ev.nombre
       ORDER BY cantidad DESC`,
      [input.estudioId, meses],
    );

    return rows.map((r: any) => ({
      estado: r.estado as string,
      cantidad: Number(r.cantidad),
    }));
  }
}
