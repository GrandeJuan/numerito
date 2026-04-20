import type { AdminDashboardSnapshotStats } from '../../application/queries/obtener-admin-dashboard-stats.query';

export interface DashboardSnapshot {
  stats: AdminDashboardSnapshotStats;
  computedAt: Date;
  stale: boolean;
}

export interface DashboardSnapshotRepository {
  getLatest(): Promise<DashboardSnapshot | null>;
  save(stats: AdminDashboardSnapshotStats): Promise<void>;
  markStale(): Promise<void>;
}

export const DASHBOARD_SNAPSHOT_REPOSITORY = Symbol('DashboardSnapshotRepository');
