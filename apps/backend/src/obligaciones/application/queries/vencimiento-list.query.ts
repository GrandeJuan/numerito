import { EntityManager } from '@mikro-orm/core';
import type { EstadoVencimiento, TipoObligacion } from '@numerito/shared';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

export interface VencimientoListQuery {
  estado?: EstadoVencimiento;
  clienteId?: string;
  periodo?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
}

export interface VencimientoListItem {
  id: string;
  clienteId: string;
  cliente: string;
  tipoObligacion: TipoObligacion;
  periodo: string;
  fechaVencimiento: string;
  descripcion: string;
  estado: EstadoVencimiento;
}

export interface VencimientoListResult {
  items: VencimientoListItem[];
  total: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

export class VencimientoListHandler {
  constructor(private readonly em: EntityManager) {}

  async execute(principal: EstudioPrincipal, query: VencimientoListQuery): Promise<VencimientoListResult> {
    const page = Math.max(1, Number(query.page) || DEFAULT_PAGE);
    const limit = Math.max(1, Number(query.limit) || DEFAULT_LIMIT);
    const offset = (page - 1) * limit;

    const whereParts: string[] = ['v.estudio_id = ?'];
    const whereParams: unknown[] = [principal.estudioId];

    if (query.estado) {
      whereParts.push('ev.codigo = ?');
      whereParams.push(query.estado);
    }
    if (query.clienteId) {
      whereParts.push('v.cliente_id = ?');
      whereParams.push(query.clienteId);
    }
    if (query.periodo) {
      whereParts.push('v.periodo = ?');
      whereParams.push(query.periodo);
    }
    if (query.fechaDesde) {
      whereParts.push('v.fecha_vencimiento >= ?');
      whereParams.push(query.fechaDesde);
    }
    if (query.fechaHasta) {
      whereParts.push('v.fecha_vencimiento <= ?');
      whereParams.push(query.fechaHasta);
    }

    const whereClause = whereParts.join(' AND ');
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
       WHERE ${whereClause}
       ORDER BY v.fecha_vencimiento DESC, v.id ASC
       LIMIT ? OFFSET ?`,
      [...whereParams, limit, offset],
    );

    const [countRow] = await conn.execute(
      `SELECT COUNT(*) AS total
       FROM vencimiento v
       JOIN estado_vencimiento ev ON v.estado_id = ev.id
       WHERE ${whereClause}`,
      whereParams,
    );

    const items: VencimientoListItem[] = rows.map((r: any) => ({
      id: r.id,
      clienteId: r.cliente_id,
      cliente: r.cliente,
      tipoObligacion: r.tipo_obligacion as TipoObligacion,
      periodo: r.periodo,
      fechaVencimiento: r.fecha_vencimiento,
      descripcion: r.descripcion,
      estado: r.estado as EstadoVencimiento,
    }));

    return {
      items,
      total: Number(countRow?.total ?? 0),
    };
  }
}
