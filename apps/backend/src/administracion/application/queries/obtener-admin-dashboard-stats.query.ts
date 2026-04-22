import { Inject, Injectable } from '@nestjs/common';
import {
  DASHBOARD_SNAPSHOT_REPOSITORY,
  type DashboardSnapshotRepository,
} from '../../domain/repositories/dashboard-snapshot.repository';
import { MaterializeDashboardSnapshotService } from '../services/materialize-dashboard-snapshot.service';
import { DashboardStatsComputer } from '../services/dashboard-stats-computer';
import { HealthCheckHandler } from './health-check.query';

export interface KpiWithSparkline {
  value: number;
  delta: string;
  deltaUp: boolean;
  sparkline: number[];
}

export interface UptimeKpi extends KpiWithSparkline {
  incidents: number;
  totalDowntimeSec: number;
  dailyStatuses: AdminServiceStatus[];
}

export interface DauMauKpi extends KpiWithSparkline {
  dau: number;
  mau: number;
  stickiness: number;
}

export type AdminPlanTone = 'brand' | 'indigo' | 'amber' | 'neutral';
export type AdminServiceStatus = 'ok' | 'warn' | 'err';
export type AdminActivityTone = 'brand' | 'amber' | 'rose' | 'indigo';

export type AdminStudioPlan = 'pro' | 'starter' | 'enterprise' | 'trial';
export type AdminStudioStatus = 'active' | 'trial' | 'risk' | 'suspended' | 'payment_failed';
export type AdminInitialsColor = 'brand' | 'indigo' | 'amber' | 'neutral';

export interface GrowthPoint {
  month: string;
  mrr: number;
  newStudios: number;
  churn: number;
}

export interface PlanDistributionEntry {
  plan: string;
  count: number;
  percent: number;
  tone: AdminPlanTone;
}

export interface ModuleUsageEntry {
  module: string;
  pctActiveStudios: number;
  tone: AdminPlanTone;
}

export interface ActivityEntry {
  id: string;
  tone: AdminActivityTone;
  body: string;
  meta?: string;
  time: string;
}

export interface ServiceHealthEntry {
  name: string;
  detail: string;
  uptime: string;
  status: AdminServiceStatus;
}

export interface AdminTopStudio {
  id: string;
  nombre: string;
  cuit: string;
  initialsColor: AdminInitialsColor;
  plan: AdminStudioPlan;
  usuarios: number;
  clientes: number;
  clientesMax?: number;
  mrr: number | null;
  actividad: number;
  status: AdminStudioStatus;
}

/**
 * Persisted (snapshot-cacheable) subset of admin dashboard stats.
 * Fresh-on-every-read fields (services, dauMau, moduleUsage, activity, uptime details)
 * are composed on top of this by the handler.
 */
export interface AdminDashboardSnapshotStats {
  kpis: {
    mrr: KpiWithSparkline;
    estudiosActivos: KpiWithSparkline;
  };
  growth: GrowthPoint[];
  planDistribution: PlanDistributionEntry[];
  topStudios: AdminTopStudio[];
}

export interface AdminDashboardStats extends AdminDashboardSnapshotStats {
  kpis: {
    mrr: KpiWithSparkline;
    estudiosActivos: KpiWithSparkline;
    dauMau: DauMauKpi | null;
    uptime: UptimeKpi;
  };
  moduleUsage: ModuleUsageEntry[];
  activity: ActivityEntry[];
  services: ServiceHealthEntry[];
}

/**
 * Dashboard stats query handler — read model pattern.
 *
 * The snapshot table caches the expensive subset (KPIs, growth, plan distribution,
 * top studios). Fresh data (services health, uptime details) is composed on every read.
 *
 * Domain event listeners mark the snapshot stale; the next read triggers recomputation.
 */
@Injectable()
export class ObtenerAdminDashboardStatsHandler {
  constructor(
    @Inject(DASHBOARD_SNAPSHOT_REPOSITORY)
    private readonly snapshotRepo: DashboardSnapshotRepository,
    private readonly materializer: MaterializeDashboardSnapshotService,
    private readonly computer: DashboardStatsComputer,
    private readonly healthCheck: HealthCheckHandler,
  ) {}

  async execute(): Promise<AdminDashboardStats> {
    const cached = await this.getSnapshotOrCompute();
    return this.enrichWithFreshData(cached);
  }

  private async getSnapshotOrCompute(): Promise<AdminDashboardSnapshotStats> {
    const snapshot = await this.snapshotRepo.getLatest();
    if (snapshot && !snapshot.stale) {
      return snapshot.stats;
    }

    const fresh = await this.computer.compute();
    this.snapshotRepo.save(fresh).catch(() => {
      // Swallow — pre-migration or transient DB failure.
    });
    return fresh;
  }

  private async enrichWithFreshData(
    cached: AdminDashboardSnapshotStats,
  ): Promise<AdminDashboardStats> {
    const health = await this.healthCheck.execute();
    const services = health.services.map<ServiceHealthEntry>((s) => ({
      name: s.name,
      detail:
        s.detail ??
        (s.latencyMs > 0
          ? `p50 · ${Math.round(s.latencyMs)}ms${s.status === 'degraded' ? ' · degradado' : ''}`
          : s.status === 'down'
            ? 'caído'
            : 'operativo'),
      uptime: s.status === 'operational' ? `${health.uptimePercent.toFixed(2)}%` : '—',
      status: toServiceStatus(s.status),
    }));

    return {
      kpis: {
        mrr: cached.kpis.mrr,
        estudiosActivos: cached.kpis.estudiosActivos,
        dauMau: null,
        uptime: {
          value: health.uptimePercent,
          delta: health.uptimePercent >= 99.9 ? 'SLA OK' : 'degradado',
          deltaUp: health.uptimePercent >= 99.9,
          sparkline: Array(12).fill(health.uptimePercent),
          incidents: services.filter((s) => s.status !== 'ok').length,
          totalDowntimeSec: 0,
          dailyStatuses: Array(30).fill('ok' as AdminServiceStatus),
        },
      },
      growth: cached.growth,
      planDistribution: cached.planDistribution,
      moduleUsage: [],
      activity: [],
      services,
      topStudios: cached.topStudios,
    };
  }
}

function toServiceStatus(s: 'operational' | 'degraded' | 'down'): AdminServiceStatus {
  if (s === 'operational') return 'ok';
  if (s === 'degraded') return 'warn';
  return 'err';
}
