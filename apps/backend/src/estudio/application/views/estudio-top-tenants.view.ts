import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

export interface EstudioTopTenantsViewInput {
  limite?: number;
}

export interface EstudioTopTenantDto {
  id: string;
  nombre: string;
  cuit: string;
  planCodigo: string;
  planNombre: string;
  maxClientes: number;
  estadoSubscripcion: string | null;
  mrr: number;
  usuarios: number;
  clientes: number;
  actividad: number;
}

@Injectable()
export class EstudioTopTenantsView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: EstudioTopTenantsViewInput = {}): Promise<EstudioTopTenantDto[]> {
    const limite = input.limite ?? 8;
    const conn = this.em.getConnection();

    const rows: any[] = await conn.execute(
      `SELECT
         e.id,
         e.nombre,
         e.cuit,
         p.codigo as plan_codigo,
         p.nombre as plan_nombre,
         p.max_clientes,
         p.precio,
         es.codigo as estado_subscripcion,
         COALESCE(ue.usuarios_count, 0)::int as usuarios,
         COALESCE(c.clientes_count, 0)::int as clientes,
         (COALESCE(ue.usuarios_count, 0) * 3 + COALESCE(c.clientes_count, 0) * 2)::int as raw_score
       FROM estudio e
       JOIN plan p ON e.plan_id = p.id
       LEFT JOIN LATERAL (
         SELECT s.estado_subscripcion_id
         FROM subscripcion s
         WHERE s.estudio_id = e.id
         ORDER BY s.fecha_inicio DESC
         LIMIT 1
       ) latest_sub ON true
       LEFT JOIN estado_subscripcion es ON es.id = latest_sub.estado_subscripcion_id
       LEFT JOIN (
         SELECT estudio_id, COUNT(*)::int as usuarios_count
         FROM usuario_estudio
         WHERE is_active = true
         GROUP BY estudio_id
       ) ue ON ue.estudio_id = e.id
       LEFT JOIN (
         SELECT estudio_id, COUNT(*)::int as clientes_count
         FROM cliente
         GROUP BY estudio_id
       ) c ON c.estudio_id = e.id
       WHERE e.is_active = true
       ORDER BY raw_score DESC
       LIMIT ?`,
      [limite],
    );

    const maxScore = rows.length > 0 ? Math.max(...rows.map((t) => Number(t.raw_score)), 1) : 1;

    return rows.map((t) => ({
      id: t.id as string,
      nombre: t.nombre as string,
      cuit: String(t.cuit ?? ''),
      planCodigo: String(t.plan_codigo ?? ''),
      planNombre: String(t.plan_nombre ?? ''),
      maxClientes: Number(t.max_clientes ?? 0),
      estadoSubscripcion: t.estado_subscripcion ? String(t.estado_subscripcion) : null,
      mrr: Number(t.precio ?? 0),
      usuarios: Number(t.usuarios),
      clientes: Number(t.clientes),
      actividad: Math.round((Number(t.raw_score) / maxScore) * 100),
    }));
  }
}
