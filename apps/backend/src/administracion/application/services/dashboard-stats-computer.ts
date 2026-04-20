import type { EstudioAdminKpisView } from '../../../estudio/application/views/estudio-admin-kpis.view';
import type { EstudioAdminSparklineView } from '../../../estudio/application/views/estudio-admin-sparkline.view';
import type { EstudioDistribucionPlanesView } from '../../../estudio/application/views/estudio-distribucion-planes.view';
import type {
  EstudioTopTenantDto,
  EstudioTopTenantsView,
} from '../../../estudio/application/views/estudio-top-tenants.view';
import type {
  AdminDashboardSnapshotStats,
  AdminInitialsColor,
  AdminPlanTone,
  AdminStudioPlan,
  AdminStudioStatus,
  AdminTopStudio,
  GrowthPoint,
  KpiWithSparkline,
  PlanDistributionEntry,
} from '../queries/obtener-admin-dashboard-stats.query';

const MONTH_SHORT_ES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

const PLAN_TONE: Record<string, AdminPlanTone> = {
  PROFESIONAL: 'brand',
  ENTERPRISE: 'indigo',
  FREE: 'amber',
};

const PLAN_SLUG: Record<string, AdminStudioPlan> = {
  PROFESIONAL: 'pro',
  ENTERPRISE: 'enterprise',
  FREE: 'starter',
};

const INITIALS_COLOR_BY_PLAN: Record<string, AdminInitialsColor> = {
  PROFESIONAL: 'brand',
  ENTERPRISE: 'indigo',
  FREE: 'amber',
};

const RISK_ACTIVIDAD_THRESHOLD = 20;

/**
 * Computes the snapshot-cacheable subset of dashboard stats.
 * Fresh-on-read data (services, uptime details, dauMau, moduleUsage, activity)
 * is composed by the handler on top of this output.
 */
export class DashboardStatsComputer {
  constructor(
    private readonly estudioKpis: EstudioAdminKpisView,
    private readonly estudioSparkline: EstudioAdminSparklineView,
    private readonly distribucionPlanes: EstudioDistribucionPlanesView,
    private readonly topTenantsView: EstudioTopTenantsView,
  ) {}

  async compute(): Promise<AdminDashboardSnapshotStats> {
    const [kpis, sparkline, distribucion, topTenants] = await Promise.all([
      this.estudioKpis.execute(),
      this.estudioSparkline.execute(),
      this.distribucionPlanes.execute(),
      this.topTenantsView.execute(),
    ]);

    const currentMrr = sparkline.mrr[sparkline.mrr.length - 1] ?? 0;

    const months = this.buildShortMonthLabels();
    const growth: GrowthPoint[] = months.map((month, i) => {
      const prevEstudios = i === 0 ? 0 : (sparkline.estudios[i - 1] ?? 0);
      const currEstudios = sparkline.estudios[i] ?? 0;
      return {
        month,
        mrr: sparkline.mrr[i] ?? 0,
        newStudios: Math.max(0, currEstudios - prevEstudios),
        churn: sparkline.churn[i] ?? 0,
      };
    });

    const totalStudios = distribucion.reduce((a, d) => a + d.cantidad, 0) || 1;
    const planDistribution: PlanDistributionEntry[] = distribucion.map((d) => ({
      plan: d.plan,
      count: d.cantidad,
      percent: Math.round((d.cantidad / totalStudios) * 100),
      tone: toPlanTone(d.plan),
    }));

    const topStudios: AdminTopStudio[] = topTenants.map(toAdminTopStudio);

    return {
      kpis: {
        mrr: this.buildKpi(currentMrr, sparkline.mrr),
        estudiosActivos: this.buildKpi(kpis.estudiosActivos, sparkline.estudios),
      },
      growth,
      planDistribution,
      topStudios,
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
    return { value: current, delta: `${sign}${deltaPercent}%`, deltaUp, sparkline };
  }

  private buildShortMonthLabels(): string[] {
    const labels: string[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(MONTH_SHORT_ES[d.getMonth()]);
    }
    return labels;
  }
}

function toPlanTone(planNombre: string): AdminPlanTone {
  const key = planNombre.toUpperCase();
  return PLAN_TONE[key] ?? 'neutral';
}

function toPlanSlug(codigo: string): AdminStudioPlan {
  return PLAN_SLUG[codigo.toUpperCase()] ?? 'starter';
}

function toInitialsColor(planCodigo: string, status: AdminStudioStatus): AdminInitialsColor {
  if (status === 'payment_failed' || status === 'suspended') return 'neutral';
  return INITIALS_COLOR_BY_PLAN[planCodigo.toUpperCase()] ?? 'neutral';
}

function toStudioStatus(estadoSubscripcion: string | null, actividad: number): AdminStudioStatus {
  if (!estadoSubscripcion) return 'suspended';
  switch (estadoSubscripcion.toUpperCase()) {
    case 'TRIAL':
      return 'trial';
    case 'SUSPENDIDA':
    case 'CANCELADA':
      return 'suspended';
    case 'VENCIDA':
      return 'payment_failed';
    case 'ACTIVA':
      return actividad < RISK_ACTIVIDAD_THRESHOLD ? 'risk' : 'active';
    default:
      return 'suspended';
  }
}

function toAdminTopStudio(t: EstudioTopTenantDto): AdminTopStudio {
  const status = toStudioStatus(t.estadoSubscripcion, t.actividad);
  const plan: AdminStudioPlan = status === 'trial' ? 'trial' : toPlanSlug(t.planCodigo);
  const hasMrr = t.estadoSubscripcion === 'ACTIVA';
  return {
    id: t.id,
    nombre: t.nombre,
    cuit: t.cuit,
    initialsColor: toInitialsColor(t.planCodigo, status),
    plan,
    usuarios: t.usuarios,
    clientes: t.clientes,
    clientesMax: t.maxClientes > 0 && t.maxClientes < 999999 ? t.maxClientes : undefined,
    mrr: hasMrr ? t.mrr : null,
    actividad: t.actividad,
    status,
  };
}
