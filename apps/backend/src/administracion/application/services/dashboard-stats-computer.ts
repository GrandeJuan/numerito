import type { EstudioAdminKpisView } from '../../estudio/application/views/estudio-admin-kpis.view';
import type { EstudioAdminSparklineView } from '../../estudio/application/views/estudio-admin-sparkline.view';
import type { EstudioRegistrosMensualesView } from '../../estudio/application/views/estudio-registros-mensuales.view';
import type { EstudioDistribucionPlanesView } from '../../estudio/application/views/estudio-distribucion-planes.view';
import type { EstudioRecientesAdminView } from '../../estudio/application/views/estudio-recientes-admin.view';
import type { EstudioTopTenantsView } from '../../estudio/application/views/estudio-top-tenants.view';
import type { EstudioRegistrosRecientesView } from '../../estudio/application/views/estudio-registros-recientes.view';
import type { UsuarioAdminKpisView } from '../../iam/application/views/usuario-admin-kpis.view';
import type {
  AdminDashboardStats,
  GrowthDataPoint,
  KpiWithSparkline,
  RevenueDataPoint,
} from '../queries/obtener-admin-dashboard-stats.query';

/**
 * Computes dashboard stats by composing source-context public views.
 *
 * All 14 queries are delegated to 8 views in estudio and iam contexts.
 * No raw SQL remains — all cross-context joins are encapsulated in views.
 */
export class DashboardStatsComputer {
  constructor(
    private readonly estudioKpis: EstudioAdminKpisView,
    private readonly estudioSparkline: EstudioAdminSparklineView,
    private readonly registrosMensuales: EstudioRegistrosMensualesView,
    private readonly distribucionPlanes: EstudioDistribucionPlanesView,
    private readonly estudiosRecientes: EstudioRecientesAdminView,
    private readonly usuarioKpis: UsuarioAdminKpisView,
    private readonly topTenantsView: EstudioTopTenantsView,
    private readonly registrosRecientesView: EstudioRegistrosRecientesView,
  ) {}

  async compute(): Promise<AdminDashboardStats> {
    const [kpis, sparkline, usuarios, registros, distribucion, recientes, topTenants, registrosRecientes] = await Promise.all([
      this.estudioKpis.execute(),
      this.estudioSparkline.execute(),
      this.usuarioKpis.execute(),
      this.registrosMensuales.execute(),
      this.distribucionPlanes.execute(),
      this.estudiosRecientes.execute(),
      this.topTenantsView.execute(),
      this.registrosRecientesView.execute(),
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
