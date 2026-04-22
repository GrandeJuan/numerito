import { AdminHealthController } from './admin-health.controller';
import { HealthCheckHandler } from '../../application/queries/health-check.query';
import { AdminGuard } from '../../../shared/infrastructure/guards/admin.guard';

describe('AdminHealthController', () => {
  let controller: AdminHealthController;
  let mockHandler: jest.Mocked<HealthCheckHandler>;

  const mockResult = {
    services: [
      {
        name: 'API Principal',
        status: 'operational' as const,
        latencyMs: 1,
        lastCheck: '2026-04-13T00:00:00.000Z',
      },
      {
        name: 'Base de Datos',
        status: 'operational' as const,
        latencyMs: 5,
        lastCheck: '2026-04-13T00:00:00.000Z',
      },
      {
        name: 'Queue Workers',
        status: 'operational' as const,
        latencyMs: 0,
        lastCheck: '2026-04-13T00:00:00.000Z',
      },
      {
        name: 'ARCA Integration',
        status: 'operational' as const,
        latencyMs: 0,
        lastCheck: '2026-04-13T00:00:00.000Z',
      },
      {
        name: 'Storage S3',
        status: 'operational' as const,
        latencyMs: 0,
        lastCheck: '2026-04-13T00:00:00.000Z',
      },
    ],
    uptimePercent: 99.95,
  };

  beforeEach(() => {
    mockHandler = {
      execute: jest.fn().mockResolvedValue(mockResult),
    } as any;
    controller = new AdminHealthController(mockHandler);
  });

  describe('getHealth', () => {
    it('should call handler and return wrapped response', async () => {
      const result = await controller.getHealth();

      expect(mockHandler.execute).toHaveBeenCalledTimes(1);
      expect(result.data).toEqual(mockResult);
      expect(result.meta).toHaveProperty('timestamp');
    });
  });

  it('should have AdminGuard applied', () => {
    const guards = Reflect.getMetadata('__guards__', AdminHealthController);
    expect(guards).toBeDefined();
    expect(guards).toContain(AdminGuard);
  });
});
