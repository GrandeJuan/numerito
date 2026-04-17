import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

export interface EstudioAdminSparklineViewInput {
  meses?: number;
}

export interface EstudioAdminSparklineDto {
  estudios: number[];
  subscripciones: number[];
  mrr: number[];
  churn: number[];
}

@Injectable()
export class EstudioAdminSparklineView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: EstudioAdminSparklineViewInput = {}): Promise<EstudioAdminSparklineDto> {
    const meses = input.meses ?? 12;
    const conn = this.em.getConnection();
    const intervalMonths = meses - 1;

    const [estudiosRows, subscripcionesRows, mrrRows, churnRows] = await Promise.all([
      conn.execute(
        `SELECT TO_CHAR(d.mes, 'YYYY-MM') as mes,
                (SELECT COUNT(*) FROM estudio WHERE is_active = true AND created_at <= d.mes + INTERVAL '1 month' - INTERVAL '1 day')::int as cantidad
         FROM generate_series(
           DATE_TRUNC('month', NOW()) - INTERVAL '${intervalMonths} months',
           DATE_TRUNC('month', NOW()),
           '1 month'
         ) d(mes)
         ORDER BY d.mes`,
      ),
      conn.execute(
        `SELECT TO_CHAR(d.mes, 'YYYY-MM') as mes,
                (SELECT COUNT(*) FROM subscripcion s
                 JOIN estado_subscripcion es ON s.estado_subscripcion_id = es.id
                 WHERE es.codigo = 'ACTIVA'
                   AND s.fecha_inicio <= d.mes + INTERVAL '1 month' - INTERVAL '1 day'
                   AND (s.fecha_fin IS NULL OR s.fecha_fin >= d.mes))::int as cantidad
         FROM generate_series(
           DATE_TRUNC('month', NOW()) - INTERVAL '${intervalMonths} months',
           DATE_TRUNC('month', NOW()),
           '1 month'
         ) d(mes)
         ORDER BY d.mes`,
      ),
      conn.execute(
        `SELECT TO_CHAR(d.mes, 'YYYY-MM') as mes,
                COALESCE((SELECT SUM(p.precio) FROM subscripcion s
                 JOIN plan p ON s.plan_id = p.id
                 JOIN estado_subscripcion es ON s.estado_subscripcion_id = es.id
                 WHERE es.codigo = 'ACTIVA'
                   AND s.fecha_inicio <= d.mes + INTERVAL '1 month' - INTERVAL '1 day'
                   AND (s.fecha_fin IS NULL OR s.fecha_fin >= d.mes)), 0) as mrr
         FROM generate_series(
           DATE_TRUNC('month', NOW()) - INTERVAL '${intervalMonths} months',
           DATE_TRUNC('month', NOW()),
           '1 month'
         ) d(mes)
         ORDER BY d.mes`,
      ),
      conn.execute(
        `SELECT TO_CHAR(d.mes, 'YYYY-MM') as mes,
                (SELECT COUNT(*) FROM subscripcion s
                 JOIN estado_subscripcion es ON s.estado_subscripcion_id = es.id
                 WHERE es.codigo = 'CANCELADA'
                   AND s.updated_at >= d.mes
                   AND s.updated_at < d.mes + INTERVAL '1 month')::int as canceladas,
                GREATEST((SELECT COUNT(*) FROM subscripcion s2
                 JOIN estado_subscripcion es2 ON s2.estado_subscripcion_id = es2.id
                 WHERE es2.codigo IN ('ACTIVA', 'CANCELADA', 'SUSPENDIDA', 'VENCIDA')
                   AND s2.fecha_inicio < d.mes
                   AND (s2.fecha_fin IS NULL OR s2.fecha_fin >= d.mes)), 1)::int as activas_inicio
         FROM generate_series(
           DATE_TRUNC('month', NOW()) - INTERVAL '${intervalMonths} months',
           DATE_TRUNC('month', NOW()),
           '1 month'
         ) d(mes)
         ORDER BY d.mes`,
      ),
    ]);

    return {
      estudios: estudiosRows.map((r: any) => Number(r.cantidad) || 0),
      subscripciones: subscripcionesRows.map((r: any) => Number(r.cantidad) || 0),
      mrr: mrrRows.map((r: any) => Number(r.mrr) || 0),
      churn: churnRows.map((r: any) =>
        Math.round((Number(r.canceladas) / Number(r.activas_inicio)) * 10000) / 100,
      ),
    };
  }
}
