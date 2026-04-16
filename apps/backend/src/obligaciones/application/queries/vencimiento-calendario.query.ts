import { EntityManager } from '@mikro-orm/core';
import type { EstadoVencimiento, TipoObligacion } from '@numerito/shared';

export interface VencimientoCalendarioQuery {
  estudioId: string;
  fechaDesde: string;
  fechaHasta: string;
}

export interface VencimientoCalendarioItem {
  id: string;
  clienteId: string;
  cliente: string;
  tipoObligacion: TipoObligacion;
  periodo: string;
  fechaVencimiento: string;
  descripcion: string;
  estado: EstadoVencimiento;
}

export class VencimientoCalendarioHandler {
  constructor(private readonly em: EntityManager) {}

  async execute(
    query: VencimientoCalendarioQuery,
  ): Promise<VencimientoCalendarioItem[]> {
    const conn = this.em.getConnection();
    const rows = await conn.execute(
      `SELECT
         v.id,
         v.cliente_id,
         c.razon_social AS cliente,
         tobl.codigo AS tipo_obligacion,
         v.periodo,
         v.fecha_vencimiento::date::text AS fecha_vencimiento,
         v.descripcion,
         ev.codigo AS estado
       FROM vencimiento v
       JOIN cliente c ON v.cliente_id = c.id
       JOIN tipo_obligacion tobl ON v.tipo_obligacion_id = tobl.id
       JOIN estado_vencimiento ev ON v.estado_id = ev.id
       WHERE v.estudio_id = ?
         AND v.fecha_vencimiento >= ?
         AND v.fecha_vencimiento <= ?
       ORDER BY v.fecha_vencimiento ASC, v.id ASC`,
      [query.estudioId, query.fechaDesde, query.fechaHasta],
    );

    return rows.map((r: any) => ({
      id: r.id,
      clienteId: r.cliente_id,
      cliente: r.cliente,
      tipoObligacion: r.tipo_obligacion as TipoObligacion,
      periodo: r.periodo,
      fechaVencimiento: r.fecha_vencimiento,
      descripcion: r.descripcion,
      estado: r.estado as EstadoVencimiento,
    }));
  }
}
