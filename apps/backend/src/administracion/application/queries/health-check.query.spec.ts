import { HealthCheckHandler } from './health-check.query';

describe('HealthCheckHandler', () => {
  let handler: HealthCheckHandler;
  let mockExecute: jest.Mock;
  let mockEm: any;

  beforeEach(() => {
    mockExecute = jest.fn().mockResolvedValue([{ ok: 1 }]);
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
      'Queue Workers',
      'ARCA Integration',
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
    mockExecute.mockRejectedValue(new Error('Connection refused'));

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

    // DB query called only once due to caching
    expect(mockExecute).toHaveBeenCalledTimes(1);
    expect(result1).toBe(result2);
  });

  it('should refresh cache after TTL expires', async () => {
    await handler.execute();

    // Manually expire the cache
    (handler as any).cache.cachedAt = Date.now() - 31_000;

    await handler.execute();

    expect(mockExecute).toHaveBeenCalledTimes(2);
  });

  it('should track history for uptime calculation', async () => {
    await handler.execute();

    // Expire cache, run again
    (handler as any).cache.cachedAt = Date.now() - 31_000;
    await handler.execute();

    const history = (handler as any).history;
    expect(history).toHaveLength(2);
    expect(history.every((h: any) => h.allOperational === true)).toBe(true);
  });

  it('should calculate uptime as 100% when all checks pass', async () => {
    const result = await handler.execute();
    expect(result.uptimePercent).toBe(100);
  });

  it('should calculate uptime correctly with failures', async () => {
    // First check: all operational
    await handler.execute();

    // Second check: DB down → not all operational
    (handler as any).cache = null;
    mockExecute.mockRejectedValue(new Error('Connection refused'));
    const result = await handler.execute();

    expect(result.uptimePercent).toBe(50);
  });

  it('should return API Principal as always operational', async () => {
    const result = await handler.execute();

    const api = result.services.find((s) => s.name === 'API Principal')!;
    expect(api.status).toBe('operational');
  });

  it('should return stub services as operational', async () => {
    const result = await handler.execute();

    const stubs = result.services.filter((s) =>
      ['Queue Workers', 'ARCA Integration', 'Storage S3'].includes(s.name),
    );
    expect(stubs).toHaveLength(3);
    stubs.forEach((s) => {
      expect(s.status).toBe('operational');
      expect(s.latencyMs).toBe(0);
    });
  });

  it('should include lastCheck ISO string for each service', async () => {
    const result = await handler.execute();

    result.services.forEach((s) => {
      expect(s.lastCheck).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  it('should prune history older than 30 days', async () => {
    // Inject old history entries
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 31);
    (handler as any).history = [
      { checkedAt: oldDate, allOperational: false },
      { checkedAt: oldDate, allOperational: false },
    ];

    const result = await handler.execute();

    // Old entries pruned, only the new check remains
    const history = (handler as any).history;
    expect(history).toHaveLength(1);
    expect(result.uptimePercent).toBe(100);
  });
});
