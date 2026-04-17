import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

export interface EstudioTopTenantsViewInput {
  limite?: number;
}

export interface EstudioTopTenantDto {
  id: string;
  nombre: string;
  plan: string;
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
         p.nombre as plan,
         COALESCE(ue.usuarios_count, 0)::int as usuarios,
         COALESCE(c.clientes_count, 0)::int as clientes,
         (COALESCE(ue.usuarios_count, 0) * 3 + COALESCE(c.clientes_count, 0) * 2)::int as raw_score
       FROM estudio e
       JOIN plan p ON e.plan_id = p.id
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

    const maxScore = rows.length > 0
      ? Math.max(...rows.map((t) => Number(t.raw_score)), 1)
      : 1;

    return rows.map((t) => ({
      id: t.id as string,
      nombre: t.nombre as string,
      plan: t.plan as string,
      usuarios: Number(t.usuarios),
      clientes: Number(t.clientes),
      actividad: Math.round((Number(t.raw_score) / maxScore) * 100),
    }));
  }
}
