import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

export interface VencimientosRecientesClienteViewInput {
  clienteId: string;
  limite?: number;
}

export interface VencimientoRecienteClienteDto {
  id: string;
  obligacion: string;
  fecha: string;
  estado: string;
}

@Injectable()
export class VencimientosRecientesClienteView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: VencimientosRecientesClienteViewInput): Promise<VencimientoRecienteClienteDto[]> {
    const limite = input.limite ?? 5;
    const conn = this.em.getConnection();

    const rows = await conn.execute(
      `SELECT v.id, to2.nombre as obligacion, v.fecha_vencimiento::text as fecha, ev.nombre as estado
       FROM vencimiento v
       JOIN tipo_obligacion to2 ON v.tipo_obligacion_id = to2.id
       JOIN estado_vencimiento ev ON v.estado_id = ev.id
       WHERE v.cliente_id = ?
       ORDER BY v.fecha_vencimiento DESC
       LIMIT ?`,
      [input.clienteId, limite],
    );

    return rows.map((r: any) => ({
      id: r.id as string,
      obligacion: r.obligacion as string,
      fecha: r.fecha as string,
      estado: r.estado as string,
    }));
  }
}
