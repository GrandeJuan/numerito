import { EntityManager } from '@mikro-orm/core';
import type { EstudioAdminKpisView } from '../../estudio/application/views/estudio-admin-kpis.view';
import type { EstudioAdminSparklineView } from '../../estudio/application/views/estudio-admin-sparkline.view';
import type { EstudioRegistrosMensualesView } from '../../estudio/application/views/estudio-registros-mensuales.view';
import type { EstudioDistribucionPlanesView } from '../../estudio/application/views/estudio-distribucion-planes.view';
import type { EstudioRecientesAdminView } from '../../estudio/application/views/estudio-recientes-admin.view';
import type { UsuarioAdminKpisView } from '../../iam/application/views/usuario-admin-kpis.view';
import type {
  AdminDashboardStats,
  GrowthDataPoint,
  KpiWithSparkline,
  RevenueDataPoint,
  TopTenant,
  RegistroReciente,
} from '../queries/obtener-admin-dashboard-stats.query';

/**
 * Computes dashboard stats by composing source-context public views.
 *
 * 12 of 14 queries are delegated to 6 views in estudio and iam contexts.
 * Only topTenants and registrosRecientes remain as raw SQL — they join
 * across estudio + iam + clientes contexts (cross-context UNION pattern
 * deferred to a future iteration).
 */
export class DashboardStatsComputer {
  constructor(
    private readonly estudioKpis: EstudioAdminKpisView,
    private readonly estudioSparkline: EstudioAdminSparklineView,
    private readonly registrosMensuales: EstudioRegistrosMensualesView,
    private readonly distribucionPlanes: EstudioDistribucionPlanesView,
    private readonly estudiosRecientes: EstudioRecientesAdminView,
    private readonly usuarioKpis: UsuarioAdminKpisView,
    private readonly em: EntityManager,
  ) {}

  async compute(): Promise<AdminDashboardStats> {
    const [kpis, sparkline, usuarios, registros, distribucion, recientes] = await Promise.all([
      this.estudioKpis.execute(),
      this.estudioSparkline.execute(),
      this.usuarioKpis.execute(),
      this.registrosMensuales.execute(),
      this.distribucionPlanes.execute(),
      this.estudiosRecientes.execute(),
    ]);

    const { estudiosActivos, subscripcionesActivas, subscripcionesPorVencer } = kpis;
    const { estudios: estudiosSparkline, subscripciones: subscripcionesSparkline, mrr: mrrSparkline, churn: churnSparkline } = sparkline;
    const { totalUsuarios, sparkline: usuariosSparkline } = usuarios;

    const currentMrr = mrrSparkline[mrrSparkline.length - 1] ?? 0;
    const currentChurn = churnSparkline[churnSparkline.length - 1] ?? 0;

    const months = this.buildMonthLabels();
    const growthData: GrowthDataPoint[] = months.map((mes, i) => ({
      mes,
      usuarios: usuariosSparkline[i] ?? 0,
      estudios: estudiosSparkline[i] ?? 0,
    }));

    const revenueData: RevenueDataPoint[] = months.map((mes, i) => {
      const mrr = mrrSparkline[i] ?? 0;
      return { mes, mrr, arr: mrr * 12 };
    });

    const alertas: AdminDashboardStats['alertas'] = [];
    if (subscripcionesPorVencer > 0) {
      alertas.push({
        tipo: 'warning',
        mensaje: `${subscripcionesPorVencer} subscripciones por vencer en los próximos 30 días`,
        fecha: new Date().toISOString().split('T')[0],
      });
    }

    const estudiosRecientesFormatted = recientes.map((e) => ({
      id: e.id,
      nombre: e.nombre,
      plan: e.plan,
      estado: e.isActive ? 'Activo' : 'Inactivo',
      creadoEn: e.createdAt,
    }));

    // Cross-context queries — remain as raw SQL (topTenants joins estudio +
    // iam + clientes; registrosRecientes joins estudio + iam).
    const conn = this.em.getConnection();

    const topTenantsRaw: any[] = await conn.execute(
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
       LIMIT 8`,
    );

    const maxScore = topTenantsRaw.length > 0
      ? Math.max(...topTenantsRaw.map((t) => Number(t.raw_score)), 1)
      : 1;

    const topTenants: TopTenant[] = topTenantsRaw.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      plan: t.plan,
      usuarios: Number(t.usuarios),
      clientes: Number(t.clientes),
      actividad: Math.round((Number(t.raw_score) / maxScore) * 100),
    }));

    const registrosRecientesRaw: any[] = await conn.execute(
      `SELECT
         e.id,
         e.nombre,
         p.nombre as plan,
         e.created_at,
         (
           SELECT u.email FROM usuario_estudio ue2
           JOIN usuario u ON u.id = ue2.usuario_id
           WHERE ue2.estudio_id = e.id
           ORDER BY ue2.created_at ASC
           LIMIT 1
         ) as email
       FROM estudio e
       JOIN plan p ON e.plan_id = p.id
       ORDER BY e.created_at DESC
       LIMIT 5`,
    );

    const registrosRecientes: RegistroReciente[] = registrosRecientesRaw.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      plan: r.plan,
      email: r.email ?? '',
      creadoEn: new Date(r.created_at).toISOString().split('T')[0],
    }));

    return {
      kpis: {
        estudiosActivos: this.buildKpi(estudiosActivos, estudiosSparkline),
        totalUsuarios: this.buildKpi(totalUsuarios, usuariosSparkline),
        subscripcionesActivas: this.buildKpi(subscripcionesActivas, subscripcionesSparkline),
        mrr: this.buildKpi(currentMrr, mrrSparkline),
        churnMensual: this.buildKpi(currentChurn, churnSparkline, true),
        uptime: {
          value: 99.98,
          delta: 'SLA OK',
          deltaUp: true,
          sparkline: Array(12).fill(99.98),
        },
      },
      growthData,
      revenueData,
      registrosMensuales: registros,
      distribucionPlanes: distribucion,
      alertas,
      estudiosRecientes: estudiosRecientesFormatted,
      topTenants,
      registrosRecientes,
    };
  }

  private buildKpi(current: number, sparkline: number[], invertDelta = false): KpiWithSparkline {
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

  private buildMonthLabels(): string[] {
    const labels: string[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return labels;
  }
}
