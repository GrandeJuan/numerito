import { EntityManager } from '@mikro-orm/core';

export interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latencyMs: number;
  lastCheck: string;
  /** Optional human-readable detail — surfaced in the dashboard below the service name. */
  detail?: string;
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
      this.checkScrapingIngesta(),
      this.checkArcaWebservices(),
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
      await this.withTimeout(
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

  /**
   * Real check: looks at configuracion_ingesta + ejecucion_ingesta.
   * Surfaces FALLIDA runs so the user notices scraping is broken instead of
   * seeing a fake "operativo 100%".
   */
  private async checkScrapingIngesta(): Promise<ServiceStatus> {
    try {
      const [{ total_24h, fallidos_24h, en_curso }] = await this.em
        .getConnection()
        .execute<[{ total_24h: string; fallidos_24h: string; en_curso: string }]>(
          `SELECT
             COUNT(*) FILTER (WHERE inicio > NOW() - INTERVAL '24 hours')            AS total_24h,
             COUNT(*) FILTER (WHERE estado = 'FALLIDA' AND inicio > NOW() - INTERVAL '24 hours') AS fallidos_24h,
             COUNT(*) FILTER (WHERE estado = 'EN_CURSO')                              AS en_curso
           FROM ejecucion_ingesta`,
        );
      const fallidas = Number(fallidos_24h);
      const total = Number(total_24h);
      const enCurso = Number(en_curso);
      const detail =
        fallidas > 0
          ? `${fallidas} fallidas · ${total} total 24h${enCurso > 0 ? ` · ${enCurso} en curso` : ''}`
          : total === 0
            ? 'sin actividad 24h'
            : `${total} ejecuciones 24h${enCurso > 0 ? ` · ${enCurso} en curso` : ''}`;
      return {
        name: 'Scraping Ingesta',
        status: fallidas > 0 ? 'degraded' : 'operational',
        latencyMs: 0,
        lastCheck: new Date().toISOString(),
        detail,
      };
    } catch {
      return {
        name: 'Scraping Ingesta',
        status: 'down',
        latencyMs: 0,
        lastCheck: new Date().toISOString(),
        detail: 'error consultando historial',
      };
    }
  }

  private async checkArcaWebservices(): Promise<ServiceStatus> {
    // Webservices de ARCA (CAE/facturación electrónica, padrón). Distinto del
    // scraping del calendario. Todavía no implementado.
    return {
      name: 'ARCA Webservices (facturación)',
      status: 'degraded',
      latencyMs: 0,
      lastCheck: new Date().toISOString(),
      detail: 'no configurado',
    };
  }

  private async checkStorageS3(): Promise<ServiceStatus> {
    if (!process.env.AWS_S3_BUCKET) {
      return {
        name: 'Storage S3',
        status: 'degraded',
        latencyMs: 0,
        lastCheck: new Date().toISOString(),
        detail: 'no configurado',
      };
    }
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
