import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type {
  DashboardSnapshot,
  DashboardSnapshotRepository,
} from '../../domain/repositories/dashboard-snapshot.repository';
import type {
  AdminDashboardSnapshotStats,
  AdminTopStudio,
  GrowthPoint,
  PlanDistributionEntry,
} from '../../application/queries/obtener-admin-dashboard-stats.query';

/**
 * PostgreSQL implementation of DashboardSnapshotRepository.
 *
 * Uses raw SQL to read/write the admin_dashboard_snapshot table.
 * Stores the snapshot-cacheable subset — KPIs, sparklines, growth series,
 * plan distribution, top studios. Fresh data (services, uptime, activity)
 * is composed by the handler and not persisted here.
 */
@Injectable()
export class PgDashboardSnapshotRepository implements DashboardSnapshotRepository {
  constructor(private readonly em: EntityManager) {}

  async getLatest(): Promise<DashboardSnapshot | null> {
    const conn = this.em.getConnection();
    const rows = await conn.execute(`SELECT * FROM "admin_dashboard_snapshot" WHERE id = 1`);

    if (rows.length === 0) return null;
    const row = rows[0];

    const mrrSparkline = this.parseJson<number[]>(row.mrr_sparkline, []);
    const estudiosSparkline = this.parseJson<number[]>(row.estudios_sparkline, []);

    if (
      Number(row.mrr) === 0 &&
      Number(row.estudios_activos) === 0 &&
      row.stale === true &&
      mrrSparkline.length === 0 &&
      estudiosSparkline.length === 0
    ) {
      return null;
    }

    return {
      stats: this.rowToStats(row),
      computedAt: new Date(row.computed_at),
      stale: row.stale,
    };
  }

  async save(stats: AdminDashboardSnapshotStats): Promise<void> {
    const conn = this.em.getConnection();
    await conn.execute(
      `UPDATE "admin_dashboard_snapshot" SET
        "mrr" = $1,
        "estudios_activos" = $2,
        "mrr_sparkline" = $3,
        "estudios_sparkline" = $4,
        "growth" = $5,
        "plan_distribution" = $6,
        "top_studios" = $7,
        "computed_at" = NOW(),
        "stale" = false
      WHERE id = 1`,
      [
        stats.kpis.mrr.value,
        stats.kpis.estudiosActivos.value,
        JSON.stringify(stats.kpis.mrr.sparkline),
        JSON.stringify(stats.kpis.estudiosActivos.sparkline),
        JSON.stringify(stats.growth),
        JSON.stringify(stats.planDistribution),
        JSON.stringify(stats.topStudios),
      ],
    );
  }

  async markStale(): Promise<void> {
    const conn = this.em.getConnection();
    await conn.execute(`UPDATE "admin_dashboard_snapshot" SET "stale" = true WHERE id = 1`);
  }

  private rowToStats(row: any): AdminDashboardSnapshotStats {
    const mrrSparkline = this.parseJson<number[]>(row.mrr_sparkline, []);
    const estudiosSparkline = this.parseJson<number[]>(row.estudios_sparkline, []);

    return {
      kpis: {
        mrr: this.buildKpi(Number(row.mrr), mrrSparkline),
        estudiosActivos: this.buildKpi(Number(row.estudios_activos), estudiosSparkline),
      },
      growth: this.parseJson<GrowthPoint[]>(row.growth, []),
      planDistribution: this.parseJson<PlanDistributionEntry[]>(row.plan_distribution, []),
      topStudios: this.parseJson<AdminTopStudio[]>(row.top_studios, []),
    };
  }

  private buildKpi(current: number, sparkline: number[]) {
    const prev = sparkline.length >= 2 ? sparkline[sparkline.length - 2] : 0;
    let deltaPercent = 0;
    if (prev > 0) {
      deltaPercent = Math.round(((current - prev) / prev) * 1000) / 10;
    }
    const sign = deltaPercent >= 0 ? '+' : '';
    return {
      value: current,
      delta: `${sign}${deltaPercent}%`,
      deltaUp: deltaPercent >= 0,
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
