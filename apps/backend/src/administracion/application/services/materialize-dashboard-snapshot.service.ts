import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import {
  DASHBOARD_SNAPSHOT_REPOSITORY,
  type DashboardSnapshotRepository,
} from '../../domain/repositories/dashboard-snapshot.repository';
import { DashboardStatsComputer } from './dashboard-stats-computer';

/**
 * Materializes the dashboard snapshot by computing fresh stats
 * and persisting them to the denormalized read model table.
 *
 * Called by:
 * - DashboardStatsListener after domain events (throttled)
 * - The dashboard handler when the snapshot is stale
 */
@Injectable()
export class MaterializeDashboardSnapshotService {
  private readonly logger = new Logger(MaterializeDashboardSnapshotService.name);
  private _refreshing = false;
  private _lastRefreshAt = 0;

  /** Minimum interval between refreshes (30 seconds) */
  private static readonly THROTTLE_MS = 30_000;

  constructor(
    private readonly computer: DashboardStatsComputer,
    @Inject(DASHBOARD_SNAPSHOT_REPOSITORY)
    private readonly snapshotRepo: DashboardSnapshotRepository,
  ) {}

  /**
   * Refresh the snapshot if not already refreshing and enough time has passed.
   * Returns true if a refresh was performed, false if throttled/skipped.
   */
  async refresh(): Promise<boolean> {
    const now = Date.now();
    if (this._refreshing) {
      this.logger.debug('Snapshot refresh already in progress, skipping');
      return false;
    }
    if (now - this._lastRefreshAt < MaterializeDashboardSnapshotService.THROTTLE_MS) {
      this.logger.debug('Snapshot refresh throttled');
      return false;
    }

    this._refreshing = true;
    try {
      const stats = await this.computer.compute();
      await this.snapshotRepo.save(stats);
      this._lastRefreshAt = Date.now();
      this.logger.log('Dashboard snapshot materialized successfully');
      return true;
    } catch (error) {
      this.logger.error('Failed to materialize dashboard snapshot', (error as Error).stack);
      return false;
    } finally {
      this._refreshing = false;
    }
  }

  /**
   * Mark the snapshot as stale so the next read triggers a refresh.
   */
  async markStale(): Promise<void> {
    try {
      await this.snapshotRepo.markStale();
    } catch (error) {
      this.logger.error('Failed to mark snapshot as stale', (error as Error).stack);
    }
  }
}
