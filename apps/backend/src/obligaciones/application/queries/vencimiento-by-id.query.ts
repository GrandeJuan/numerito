import { EntityManager } from '@mikro-orm/core';
import type { EstadoVencimiento, TipoObligacion } from '@numerito/shared';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

export interface VencimientoByIdQuery {
  id: string;
}

export interface VencimientoByIdResult {
  id: string;
  clienteId: string;
  cliente: string;
  tipoObligacion: TipoObligacion;
  periodo: string;
  fechaVencimiento: string;
  descripcion: string;
  estado: EstadoVencimiento;
}

export class VencimientoByIdHandler {
  constructor(private readonly em: EntityManager) {}

  async execute(principal: EstudioPrincipal, query: VencimientoByIdQuery): Promise<VencimientoByIdResult> {
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
       WHERE v.id = ? AND v.estudio_id = ?
       LIMIT 1`,
      [query.id, principal.estudioId],
    );

    const row = rows[0];
    if (!row) throw new RecursoNoEncontradoError('Vencimiento');

    return {
      id: row.id,
      clienteId: row.cliente_id,
      cliente: row.cliente,
      tipoObligacion: row.tipo_obligacion as TipoObligacion,
      periodo: row.periodo,
      fechaVencimiento: row.fecha_vencimiento,
      descripcion: row.descripcion,
      estado: row.estado as EstadoVencimiento,
    };
  }
}
