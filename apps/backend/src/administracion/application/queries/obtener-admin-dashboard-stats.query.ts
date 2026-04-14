import { Inject, Injectable } from '@nestjs/common';
import {
  DASHBOARD_SNAPSHOT_REPOSITORY,
  type DashboardSnapshotRepository,
} from '../../domain/repositories/dashboard-snapshot.repository';
import { MaterializeDashboardSnapshotService } from '../services/materialize-dashboard-snapshot.service';
import { DashboardStatsComputer } from '../services/dashboard-stats-computer';

export interface KpiWithSparkline {
  value: number;
  delta: string;
  deltaUp: boolean;
  sparkline: number[];
}

export interface GrowthDataPoint {
  mes: string;
  usuarios: number;
  estudios: number;
}

export interface RevenueDataPoint {
  mes: string;
  mrr: number;
  arr: number;
}

export interface TopTenant {
  id: string;
  nombre: string;
  plan: string;
  usuarios: number;
  clientes: number;
  actividad: number;
}

export interface RegistroReciente {
  id: string;
  nombre: string;
  plan: string;
  email: string;
  creadoEn: string;
}

export interface AdminDashboardStats {
  kpis: {
    estudiosActivos: KpiWithSparkline;
    totalUsuarios: KpiWithSparkline;
    subscripcionesActivas: KpiWithSparkline;
    mrr: KpiWithSparkline;
    churnMensual: KpiWithSparkline;
    uptime: KpiWithSparkline;
  };
  growthData: GrowthDataPoint[];
  revenueData: RevenueDataPoint[];
  registrosMensuales: { mes: string; cantidad: number }[];
  distribucionPlanes: { plan: string; cantidad: number }[];
  alertas: { tipo: string; mensaje: string; fecha: string }[];
  estudiosRecientes: { id: string; nombre: string; plan: string; estado: string; creadoEn: string }[];
  topTenants: TopTenant[];
  registrosRecientes: RegistroReciente[];
}

/**
 * Dashboard stats query handler — read model pattern.
 *
 * Reads from the denormalized admin_dashboard_snapshot table (owned by this
 * context). When the snapshot is stale or empty, triggers a materialization
 * and falls back to live computation via DashboardStatsComputer.
 *
 * The snapshot table is maintained by domain event listeners — events from
 * other bounded contexts mark it as stale, and the materializer recomputes.
 */
@Injectable()
export class ObtenerAdminDashboardStatsHandler {
  constructor(
    @Inject(DASHBOARD_SNAPSHOT_REPOSITORY)
    private readonly snapshotRepo: DashboardSnapshotRepository,
    private readonly materializer: MaterializeDashboardSnapshotService,
    private readonly computer: DashboardStatsComputer,
  ) {}

  async execute(): Promise<AdminDashboardStats> {
    // Try the snapshot first — fast path, no cross-context queries
    const snapshot = await this.snapshotRepo.getLatest();

    if (snapshot && !snapshot.stale) {
      return snapshot.stats;
    }

    // Snapshot is stale or doesn't exist — compute fresh stats
    const stats = await this.computer.compute();

    // Persist to snapshot table asynchronously (don't block the response)
    this.snapshotRepo.save(stats).catch(() => {
      // Swallow — the snapshot table might not exist yet (pre-migration)
    });

    return stats;
  }
}
