import { HealthCheckHandler } from './health-check.query';

describe('HealthCheckHandler', () => {
  let handler: HealthCheckHandler;
  let mockExecute: jest.Mock;
  let mockEm: any;

  beforeEach(() => {
    // Two queries run against the DB: SELECT 1 (DB health) and scraping-ingesta stats.
    // Route by SQL prefix so tests can independently simulate failures.
    mockExecute = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('SELECT 1')) return Promise.resolve([{ ok: 1 }]);
      if (sql.includes('ejecucion_ingesta')) {
        return Promise.resolve([{ total_24h: '0', fallidos_24h: '0', en_curso: '0' }]);
      }
      return Promise.resolve([]);
    });
    mockEm = {
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
    handler = new HealthCheckHandler(mockEm);
  });

  it('should return 5 services', async () => {
    const result = await handler.execute();

    expect(result.services).toHaveLength(5);
    const names = result.services.map((s) => s.name);
    expect(names).toEqual([
      'API Principal',
      'Base de Datos',
      'Scraping Ingesta',
      'ARCA Webservices (facturación)',
      'Storage S3',
    ]);
  });

  it('should return operational status when DB responds', async () => {
    const result = await handler.execute();

    const db = result.services.find((s) => s.name === 'Base de Datos')!;
    expect(db.status).toBe('operational');
    expect(db.latencyMs).toBeGreaterThanOrEqual(0);
    expect(db.lastCheck).toBeDefined();
  });

  it('should return down status when DB fails', async () => {
    mockExecute.mockImplementation((sql: string) => {
      if (sql.includes('SELECT 1')) return Promise.reject(new Error('Connection refused'));
      return Promise.resolve([{ total_24h: '0', fallidos_24h: '0', en_curso: '0' }]);
    });

    const result = await handler.execute();

    const db = result.services.find((s) => s.name === 'Base de Datos')!;
    expect(db.status).toBe('down');
  });

  it('should return uptimePercent', async () => {
    const result = await handler.execute();

    expect(typeof result.uptimePercent).toBe('number');
    expect(result.uptimePercent).toBeGreaterThanOrEqual(0);
    expect(result.uptimePercent).toBeLessThanOrEqual(100);
  });

  it('should cache results for 30 seconds', async () => {
    const result1 = await handler.execute();
    const result2 = await handler.execute();

    // Two DB queries per check (SELECT 1 + scraping stats) — but only one check.
    expect(mockExecute).toHaveBeenCalledTimes(2);
    expect(result1).toBe(result2);
  });

  it('should refresh cache after TTL expires', async () => {
    await handler.execute();
    const callsFirst = mockExecute.mock.calls.length;

    (handler as any).cache.cachedAt = Date.now() - 31_000;

    await handler.execute();

    expect(mockExecute.mock.calls.length).toBeGreaterThan(callsFirst);
  });

  it('should track history for uptime calculation', async () => {
    await handler.execute();

    (handler as any).cache.cachedAt = Date.now() - 31_000;
    await handler.execute();

    const history = (handler as any).history;
    expect(history).toHaveLength(2);
  });

  it('should return API Principal as always operational', async () => {
    const result = await handler.execute();

    const api = result.services.find((s) => s.name === 'API Principal')!;
    expect(api.status).toBe('operational');
  });

  it('should report ARCA Webservices as degraded (stub — no configurado)', async () => {
    const result = await handler.execute();

    const arca = result.services.find((s) => s.name === 'ARCA Webservices (facturación)')!;
    expect(arca.status).toBe('degraded');
    expect(arca.detail).toBe('no configurado');
  });

  it('should report Storage S3 as degraded when AWS_S3_BUCKET unset', async () => {
    delete process.env.AWS_S3_BUCKET;
    const result = await handler.execute();

    const s3 = result.services.find((s) => s.name === 'Storage S3')!;
    expect(s3.status).toBe('degraded');
  });

  it('should include lastCheck ISO string for each service', async () => {
    const result = await handler.execute();

    result.services.forEach((s) => {
      expect(s.lastCheck).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  it('should prune history older than 30 days', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 31);
    (handler as any).history = [
      { checkedAt: oldDate, allOperational: false },
      { checkedAt: oldDate, allOperational: false },
    ];

    await handler.execute();

    const history = (handler as any).history;
    expect(history).toHaveLength(1);
  });
});
