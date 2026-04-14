import type { AdminDashboardStats } from '../../application/queries/obtener-admin-dashboard-stats.query';

export interface DashboardSnapshot {
  stats: AdminDashboardStats;
  computedAt: Date;
  stale: boolean;
}

export interface DashboardSnapshotRepository {
  getLatest(): Promise<DashboardSnapshot | null>;
  save(stats: AdminDashboardStats): Promise<void>;
  markStale(): Promise<void>;
}

export const DASHBOARD_SNAPSHOT_REPOSITORY = Symbol('DashboardSnapshotRepository');
