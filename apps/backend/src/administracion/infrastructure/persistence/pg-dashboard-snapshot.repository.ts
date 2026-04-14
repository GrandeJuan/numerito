import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type {
  DashboardSnapshot,
  DashboardSnapshotRepository,
} from '../../domain/repositories/dashboard-snapshot.repository';
import type { AdminDashboardStats } from '../../application/queries/obtener-admin-dashboard-stats.query';

/**
 * PostgreSQL implementation of DashboardSnapshotRepository.
 *
 * Uses raw SQL to read/write the admin_dashboard_snapshot table,
 * which is owned by the administracion bounded context.
 * No ORM entities needed — this is a denormalized read model.
 */
@Injectable()
export class PgDashboardSnapshotRepository implements DashboardSnapshotRepository {
  constructor(private readonly em: EntityManager) {}

  async getLatest(): Promise<DashboardSnapshot | null> {
    const conn = this.em.getConnection();
    const rows = await conn.execute(`SELECT * FROM "admin_dashboard_snapshot" WHERE id = 1`);

    if (rows.length === 0) return null;
    const row = rows[0];

    // If all KPI values are zero and sparklines are empty, treat as unseeded
    const estudiosSparklineParsed = this.parseJson<number[]>(row.estudios_sparkline, []);
    if (
      Number(row.estudios_activos) === 0 &&
      Number(row.total_usuarios) === 0 &&
      Number(row.subscripciones_activas) === 0 &&
      row.stale === true &&
      estudiosSparklineParsed.length === 0
    ) {
      return null;
    }

    return {
      stats: this.rowToStats(row),
      computedAt: new Date(row.computed_at),
      stale: row.stale,
    };
  }

  async save(stats: AdminDashboardStats): Promise<void> {
    const conn = this.em.getConnection();
    await conn.execute(
      `UPDATE "admin_dashboard_snapshot" SET
        "estudios_activos" = $1,
        "total_usuarios" = $2,
        "subscripciones_activas" = $3,
        "mrr" = $4,
        "churn_mensual" = $5,
        "uptime" = $6,
        "estudios_sparkline" = $7,
        "usuarios_sparkline" = $8,
        "subscripciones_sparkline" = $9,
        "mrr_sparkline" = $10,
        "churn_sparkline" = $11,
        "growth_data" = $12,
        "revenue_data" = $13,
        "registros_mensuales" = $14,
        "distribucion_planes" = $15,
        "alertas" = $16,
        "estudios_recientes" = $17,
        "top_tenants" = $18,
        "registros_recientes" = $19,
        "computed_at" = NOW(),
        "stale" = false
      WHERE id = 1`,
      [
        stats.kpis.estudiosActivos.value,
        stats.kpis.totalUsuarios.value,
        stats.kpis.subscripcionesActivas.value,
        stats.kpis.mrr.value,
        stats.kpis.churnMensual.value,
        stats.kpis.uptime.value,
        JSON.stringify(stats.kpis.estudiosActivos.sparkline),
        JSON.stringify(stats.kpis.totalUsuarios.sparkline),
        JSON.stringify(stats.kpis.subscripcionesActivas.sparkline),
        JSON.stringify(stats.kpis.mrr.sparkline),
        JSON.stringify(stats.kpis.churnMensual.sparkline),
        JSON.stringify(stats.growthData),
        JSON.stringify(stats.revenueData),
        JSON.stringify(stats.registrosMensuales),
        JSON.stringify(stats.distribucionPlanes),
        JSON.stringify(stats.alertas),
        JSON.stringify(stats.estudiosRecientes),
        JSON.stringify(stats.topTenants),
        JSON.stringify(stats.registrosRecientes),
      ],
    );
  }

  async markStale(): Promise<void> {
    const conn = this.em.getConnection();
    await conn.execute(`UPDATE "admin_dashboard_snapshot" SET "stale" = true WHERE id = 1`);
  }

  private rowToStats(row: any): AdminDashboardStats {
    const estudiosSparkline = this.parseJson(row.estudios_sparkline, []);
    const usuariosSparkline = this.parseJson(row.usuarios_sparkline, []);
    const subscripcionesSparkline = this.parseJson(row.subscripciones_sparkline, []);
    const mrrSparkline = this.parseJson(row.mrr_sparkline, []);
    const churnSparkline = this.parseJson(row.churn_sparkline, []);

    return {
      kpis: {
        estudiosActivos: this.buildKpi(Number(row.estudios_activos), estudiosSparkline),
        totalUsuarios: this.buildKpi(Number(row.total_usuarios), usuariosSparkline),
        subscripcionesActivas: this.buildKpi(
          Number(row.subscripciones_activas),
          subscripcionesSparkline,
        ),
        mrr: this.buildKpi(Number(row.mrr), mrrSparkline),
        churnMensual: this.buildKpi(Number(row.churn_mensual), churnSparkline, true),
        uptime: {
          value: Number(row.uptime),
          delta: 'SLA OK',
          deltaUp: true,
          sparkline: Array(12).fill(Number(row.uptime)),
        },
      },
      growthData: this.parseJson(row.growth_data, []),
      revenueData: this.parseJson(row.revenue_data, []),
      registrosMensuales: this.parseJson(row.registros_mensuales, []),
      distribucionPlanes: this.parseJson(row.distribucion_planes, []),
      alertas: this.parseJson(row.alertas, []),
      estudiosRecientes: this.parseJson(row.estudios_recientes, []),
      topTenants: this.parseJson(row.top_tenants, []),
      registrosRecientes: this.parseJson(row.registros_recientes, []),
    };
  }

  private buildKpi(current: number, sparkline: number[], invertDelta = false) {
    const prev = sparkline.length >= 2 ? sparkline[sparkline.length - 2] : 0;
    let deltaPercent = 0;
    if (prev > 0) {
      deltaPercent = Math.round(((current - prev) / prev) * 1000) / 10;
    }
    const deltaUp = invertDelta ? deltaPercent <= 0 : deltaPercent >= 0;
    const sign = deltaPercent >= 0 ? '+' : '';
    return {
      value: current,
      delta: `${sign}${deltaPercent}%`,
      deltaUp,
      sparkline,
    };
  }

  private parseJson<T>(value: unknown, fallback: T): T {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return fallback;
      }
    }
    if (value && typeof value === 'object') return value as T;
    return fallback;
  }
}
