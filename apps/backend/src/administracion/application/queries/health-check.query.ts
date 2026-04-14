import { EntityManager } from '@mikro-orm/core';

export interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latencyMs: number;
  lastCheck: string;
}

export interface HealthCheckResult {
  services: ServiceStatus[];
  uptimePercent: number;
}

interface HealthCheckRecord {
  checkedAt: Date;
  allOperational: boolean;
}

export class HealthCheckHandler {
  private cache: { result: HealthCheckResult; cachedAt: number } | null = null;
  private static readonly CACHE_TTL_MS = 30_000;
  private static readonly LATENCY_DEGRADED_MS = 2000;
  private static readonly TIMEOUT_MS = 5000;
  private history: HealthCheckRecord[] = [];

  constructor(private readonly em: EntityManager) {}

  async execute(): Promise<HealthCheckResult> {
    const now = Date.now();
    if (this.cache && now - this.cache.cachedAt < HealthCheckHandler.CACHE_TTL_MS) {
      return this.cache.result;
    }

    const services = await Promise.all([
      this.checkApi(),
      this.checkDatabase(),
      this.checkQueueWorkers(),
      this.checkArcaIntegration(),
      this.checkStorageS3(),
    ]);

    const allOperational = services.every((s) => s.status === 'operational');
    this.history.push({ checkedAt: new Date(), allOperational });

    // Keep only last 30 days of history
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    this.history = this.history.filter((h) => h.checkedAt >= thirtyDaysAgo);

    const uptimePercent = this.calculateUptime();

    const result: HealthCheckResult = { services, uptimePercent };
    this.cache = { result, cachedAt: now };
    return result;
  }

  private calculateUptime(): number {
    if (this.history.length === 0) return 100;
    const successful = this.history.filter((h) => h.allOperational).length;
    return Math.round((successful / this.history.length) * 10000) / 100;
  }

  private async checkApi(): Promise<ServiceStatus> {
    const start = Date.now();
    return {
      name: 'API Principal',
      status: 'operational',
      latencyMs: Date.now() - start,
      lastCheck: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<ServiceStatus> {
    const start = Date.now();
    try {
      const result = await this.withTimeout(
        this.em.getConnection().execute('SELECT 1 as ok'),
        HealthCheckHandler.TIMEOUT_MS,
      );
      const latency = Date.now() - start;
      const status = latency > HealthCheckHandler.LATENCY_DEGRADED_MS ? 'degraded' : 'operational';
      return {
        name: 'Base de Datos',
        status,
        latencyMs: latency,
        lastCheck: new Date().toISOString(),
      };
    } catch {
      return {
        name: 'Base de Datos',
        status: 'down',
        latencyMs: Date.now() - start,
        lastCheck: new Date().toISOString(),
      };
    }
  }

  private async checkQueueWorkers(): Promise<ServiceStatus> {
    // Stub — no queue infrastructure yet
    return {
      name: 'Queue Workers',
      status: 'operational',
      latencyMs: 0,
      lastCheck: new Date().toISOString(),
    };
  }

  private async checkArcaIntegration(): Promise<ServiceStatus> {
    // Stub — ARCA integration not yet implemented
    return {
      name: 'ARCA Integration',
      status: 'operational',
      latencyMs: 0,
      lastCheck: new Date().toISOString(),
    };
  }

  private async checkStorageS3(): Promise<ServiceStatus> {
    // Stub — S3 storage not yet configured
    return {
      name: 'Storage S3',
      status: 'operational',
      latencyMs: 0,
      lastCheck: new Date().toISOString(),
    };
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout')), ms);
      promise
        .then((val) => {
          clearTimeout(timer);
          resolve(val);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }
}
