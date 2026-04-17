import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

export interface ProximosVencimientosDetalleViewInput {
  estudioId: string;
  limite?: number;
}

export interface ProximoVencimientoDetalleDto {
  id: string;
  cliente: string;
  obligacion: string;
  fecha: string;
  estado: string;
}

@Injectable()
export class ProximosVencimientosDetalleView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: ProximosVencimientosDetalleViewInput): Promise<ProximoVencimientoDetalleDto[]> {
    const limite = input.limite ?? 5;
    const conn = this.em.getConnection();

    const rows = await conn.execute(
      `SELECT v.id, c.razon_social as cliente, to2.nombre as obligacion,
              v.fecha_vencimiento::text as fecha, ev.nombre as estado
       FROM vencimiento v
       JOIN cliente c ON v.cliente_id = c.id
       JOIN tipo_obligacion to2 ON v.tipo_obligacion_id = to2.id
       JOIN estado_vencimiento ev ON v.estado_id = ev.id
       WHERE v.estudio_id = ?
         AND v.fecha_vencimiento >= NOW()
       ORDER BY v.fecha_vencimiento ASC
       LIMIT ?`,
      [input.estudioId, limite],
    );

    return rows.map((r: any) => ({
      id: r.id as string,
      cliente: r.cliente as string,
      obligacion: r.obligacion as string,
      fecha: r.fecha as string,
      estado: r.estado as string,
    }));
  }
}
