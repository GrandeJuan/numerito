import { AwsFargateTaskLauncher } from './aws-fargate-task-launcher';
import { ResourceNotFoundException } from '@aws-sdk/client-cloudwatch-logs';

// Mock the ECS client
const mockEcsSend = jest.fn();
jest.mock('@aws-sdk/client-ecs', () => ({
  ECSClient: jest.fn().mockImplementation(() => ({ send: mockEcsSend })),
  RunTaskCommand: jest.fn().mockImplementation((input: unknown) => input),
}));

// Mock the CloudWatch Logs client
const mockCwlSend = jest.fn();
jest.mock('@aws-sdk/client-cloudwatch-logs', () => {
  class MockResourceNotFoundException extends Error {
    name = 'ResourceNotFoundException';
    constructor(opts: { message: string }) {
      super(opts.message);
    }
  }
  return {
    CloudWatchLogsClient: jest.fn().mockImplementation(() => ({ send: mockCwlSend })),
    GetLogEventsCommand: jest.fn().mockImplementation((input: unknown) => input),
    ResourceNotFoundException: MockResourceNotFoundException,
  };
});

const DEFAULT_CONFIG = {
  clusterArn: 'arn:aws:ecs:us-east-1:123:cluster/numerito',
  taskDefinitionArns: {
    ARCA: 'arn:aws:ecs:us-east-1:123:task-definition/scraper-arca:1',
  },
  subnets: ['subnet-aaa', 'subnet-bbb'],
  securityGroups: ['sg-xxx'],
};

const LOG_CONFIG = {
  ...DEFAULT_CONFIG,
  logGroupName: '/ecs/numerito-prod-scraper',
};

describe('AwsFargateTaskLauncher', () => {
  beforeEach(() => {
    mockEcsSend.mockReset();
    mockCwlSend.mockReset();
  });

  it('should launch a Fargate task and return taskArn', async () => {
    mockEcsSend.mockResolvedValue({
      tasks: [{ taskArn: 'arn:aws:ecs:us-east-1:123:task/abc-def' }],
      failures: [],
    });

    const launcher = new AwsFargateTaskLauncher(DEFAULT_CONFIG);
    const result = await launcher.launch('ARCA', {
      ejecucionId: 'ej-1',
      disparadoPor: 'admin-user',
    });

    expect(result.taskArn).toBe('arn:aws:ecs:us-east-1:123:task/abc-def');
    expect(result.fuente).toBe('ARCA');
    expect(result.launchedAt).toBeDefined();

    // Verify RunTask command structure
    const command = mockEcsSend.mock.calls[0][0];
    expect(command.cluster).toBe(DEFAULT_CONFIG.clusterArn);
    expect(command.taskDefinition).toBe(DEFAULT_CONFIG.taskDefinitionArns.ARCA);
    expect(command.launchType).toBe('FARGATE');
    expect(command.networkConfiguration.awsvpcConfiguration.subnets).toEqual(
      DEFAULT_CONFIG.subnets,
    );
  });

  it('should pass MANUAL disparador and disparadoPor as container overrides', async () => {
    mockEcsSend.mockResolvedValue({
      tasks: [{ taskArn: 'arn:aws:ecs:us-east-1:123:task/xyz' }],
    });

    const launcher = new AwsFargateTaskLauncher(DEFAULT_CONFIG);
    await launcher.launch('ARCA', { ejecucionId: 'ej-456', disparadoPor: 'user-456' });

    const command = mockEcsSend.mock.calls[0][0];
    const overrides = command.overrides.containerOverrides[0];
    expect(overrides.name).toBe('scraper');
    expect(overrides.environment).toEqual([
      { name: 'DISPARADOR', value: 'MANUAL' },
      { name: 'DISPARADO_POR', value: 'user-456' },
      { name: 'EJECUCION_ID', value: 'ej-456' },
    ]);
  });

  it('should throw if no task definition configured for fuente', async () => {
    const launcher = new AwsFargateTaskLauncher(DEFAULT_CONFIG);

    await expect(
      launcher.launch('ARBA' as any, { ejecucionId: 'ej-1', disparadoPor: 'admin' }),
    ).rejects.toThrow('No task definition configured for fuente: ARBA');
    expect(mockEcsSend).not.toHaveBeenCalled();
  });

  it('should throw with failure details when RunTask returns no tasks', async () => {
    mockEcsSend.mockResolvedValue({
      tasks: [],
      failures: [{ reason: 'RESOURCE', detail: 'insufficient capacity' }],
    });

    const launcher = new AwsFargateTaskLauncher(DEFAULT_CONFIG);

    await expect(
      launcher.launch('ARCA', { ejecucionId: 'ej-1', disparadoPor: 'admin' }),
    ).rejects.toThrow('Failed to launch Fargate task for ARCA: RESOURCE: insufficient capacity');
  });

  it('should set assignPublicIp DISABLED by default', async () => {
    mockEcsSend.mockResolvedValue({
      tasks: [{ taskArn: 'arn:aws:ecs:us-east-1:123:task/t1' }],
    });

    const launcher = new AwsFargateTaskLauncher(DEFAULT_CONFIG);
    await launcher.launch('ARCA', { ejecucionId: 'ej-1', disparadoPor: 'admin' });

    const command = mockEcsSend.mock.calls[0][0];
    expect(command.networkConfiguration.awsvpcConfiguration.assignPublicIp).toBe('DISABLED');
  });

  it('should set assignPublicIp ENABLED when configured', async () => {
    mockEcsSend.mockResolvedValue({
      tasks: [{ taskArn: 'arn:aws:ecs:us-east-1:123:task/t1' }],
    });

    const launcher = new AwsFargateTaskLauncher({ ...DEFAULT_CONFIG, assignPublicIp: true });
    await launcher.launch('ARCA', { ejecucionId: 'ej-1', disparadoPor: 'admin' });

    const command = mockEcsSend.mock.calls[0][0];
    expect(command.networkConfiguration.awsvpcConfiguration.assignPublicIp).toBe('ENABLED');
  });

  // ── getLogs ──

  describe('getLogs', () => {
    it('should return log events from CloudWatch', async () => {
      mockCwlSend.mockResolvedValue({
        events: [
          { message: '2026-04-22T10:00:00Z Scraping ARCA...\n' },
          { message: '2026-04-22T10:00:05Z Found 15 reglas\n' },
        ],
      });

      const launcher = new AwsFargateTaskLauncher(LOG_CONFIG);
      const logs = await launcher.getLogs('abc-123-def');

      expect(logs).toBe(
        '2026-04-22T10:00:00Z Scraping ARCA...\n2026-04-22T10:00:05Z Found 15 reglas\n',
      );

      const command = mockCwlSend.mock.calls[0][0];
      expect(command.logGroupName).toBe('/ecs/numerito-prod-scraper');
      expect(command.logStreamName).toBe('arca/scraper/abc-123-def');
      expect(command.limit).toBe(500);
      expect(command.startFromHead).toBe(false);
    });

    it('should extract task ID from full ARN', async () => {
      mockCwlSend.mockResolvedValue({
        events: [{ message: 'hello\n' }],
      });

      const launcher = new AwsFargateTaskLauncher(LOG_CONFIG);
      await launcher.getLogs('arn:aws:ecs:us-east-1:123456:task/numerito-cluster/abc-def-ghi');

      const command = mockCwlSend.mock.calls[0][0];
      expect(command.logStreamName).toBe('arca/scraper/abc-def-ghi');
    });

    it('should extract task ID from short ARN format', async () => {
      mockCwlSend.mockResolvedValue({
        events: [{ message: 'hello\n' }],
      });

      const launcher = new AwsFargateTaskLauncher(LOG_CONFIG);
      await launcher.getLogs('arn:aws:ecs:us-east-1:123456:task/abc-def-ghi');

      const command = mockCwlSend.mock.calls[0][0];
      expect(command.logStreamName).toBe('arca/scraper/abc-def-ghi');
    });

    it('should return human-friendly message when stream does not exist', async () => {
      mockCwlSend.mockRejectedValue(
        new ResourceNotFoundException({ message: 'stream not found', $metadata: {} }),
      );

      const launcher = new AwsFargateTaskLauncher(LOG_CONFIG);
      const logs = await launcher.getLogs('pending-task-id');

      expect(logs).toContain('no existe todavía');
      expect(logs).toContain('arca/scraper/pending-task-id');
    });

    it('should return message when log stream exists but has no events', async () => {
      mockCwlSend.mockResolvedValue({ events: [] });

      const launcher = new AwsFargateTaskLauncher(LOG_CONFIG);
      const logs = await launcher.getLogs('starting-task');

      expect(logs).toContain('aún no tiene eventos');
    });

    it('should return fallback message when logGroupName is not configured', async () => {
      const launcher = new AwsFargateTaskLauncher(DEFAULT_CONFIG);
      const logs = await launcher.getLogs('any-task');

      expect(logs).toContain('SCRAPER_LOG_GROUP no configurado');
      expect(mockCwlSend).not.toHaveBeenCalled();
    });

    it('should rethrow non-ResourceNotFoundException errors', async () => {
      mockCwlSend.mockRejectedValue(new Error('access denied'));

      const launcher = new AwsFargateTaskLauncher(LOG_CONFIG);

      await expect(launcher.getLogs('some-task')).rejects.toThrow(
        'No se pudieron leer logs de CloudWatch: access denied',
      );
    });

    it('should handle events with null messages', async () => {
      mockCwlSend.mockResolvedValue({
        events: [{ message: 'line1\n' }, { message: null }, { message: 'line3\n' }],
      });

      const launcher = new AwsFargateTaskLauncher(LOG_CONFIG);
      const logs = await launcher.getLogs('task-with-nulls');

      expect(logs).toBe('line1\nline3\n');
    });

    it('should use fuente parameter for stream prefix when provided', async () => {
      mockCwlSend.mockResolvedValue({
        events: [{ message: 'arba log\n' }],
      });

      const multiConfig = {
        ...LOG_CONFIG,
        taskDefinitionArns: {
          ARCA: 'arn:aws:ecs:us-east-1:123:task-definition/scraper-arca:1',
          ARBA: 'arn:aws:ecs:us-east-1:123:task-definition/scraper-arba:1',
        },
      };
      const launcher = new AwsFargateTaskLauncher(multiConfig);
      await launcher.getLogs('task-xyz', 'ARBA' as any);

      const command = mockCwlSend.mock.calls[0][0];
      expect(command.logStreamName).toBe('arba/scraper/task-xyz');
    });
  });
});
