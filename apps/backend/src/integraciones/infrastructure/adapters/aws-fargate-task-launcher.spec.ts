import { AwsFargateTaskLauncher } from './aws-fargate-task-launcher';

// Mock the ECS client
const mockSend = jest.fn();
jest.mock('@aws-sdk/client-ecs', () => ({
  ECSClient: jest.fn().mockImplementation(() => ({ send: mockSend })),
  RunTaskCommand: jest.fn().mockImplementation((input: unknown) => input),
}));

const DEFAULT_CONFIG = {
  clusterArn: 'arn:aws:ecs:us-east-1:123:cluster/numerito',
  taskDefinitionArns: {
    ARCA: 'arn:aws:ecs:us-east-1:123:task-definition/scraper-arca:1',
  },
  subnets: ['subnet-aaa', 'subnet-bbb'],
  securityGroups: ['sg-xxx'],
};

describe('AwsFargateTaskLauncher', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it('should launch a Fargate task and return taskArn', async () => {
    mockSend.mockResolvedValue({
      tasks: [{ taskArn: 'arn:aws:ecs:us-east-1:123:task/abc-def' }],
      failures: [],
    });

    const launcher = new AwsFargateTaskLauncher(DEFAULT_CONFIG);
    const result = await launcher.launch('ARCA', 'admin-user');

    expect(result.taskArn).toBe('arn:aws:ecs:us-east-1:123:task/abc-def');
    expect(result.fuente).toBe('ARCA');
    expect(result.launchedAt).toBeDefined();

    // Verify RunTask command structure
    const command = mockSend.mock.calls[0][0];
    expect(command.cluster).toBe(DEFAULT_CONFIG.clusterArn);
    expect(command.taskDefinition).toBe(DEFAULT_CONFIG.taskDefinitionArns.ARCA);
    expect(command.launchType).toBe('FARGATE');
    expect(command.networkConfiguration.awsvpcConfiguration.subnets).toEqual(DEFAULT_CONFIG.subnets);
  });

  it('should pass MANUAL disparador and disparadoPor as container overrides', async () => {
    mockSend.mockResolvedValue({
      tasks: [{ taskArn: 'arn:aws:ecs:us-east-1:123:task/xyz' }],
    });

    const launcher = new AwsFargateTaskLauncher(DEFAULT_CONFIG);
    await launcher.launch('ARCA', 'user-456');

    const command = mockSend.mock.calls[0][0];
    const overrides = command.overrides.containerOverrides[0];
    expect(overrides.name).toBe('scraper');
    expect(overrides.environment).toEqual([
      { name: 'DISPARADOR', value: 'MANUAL' },
      { name: 'DISPARADO_POR', value: 'user-456' },
    ]);
  });

  it('should throw if no task definition configured for fuente', async () => {
    const launcher = new AwsFargateTaskLauncher(DEFAULT_CONFIG);

    await expect(launcher.launch('ARBA' as any, 'admin')).rejects.toThrow(
      'No task definition configured for fuente: ARBA',
    );
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('should throw with failure details when RunTask returns no tasks', async () => {
    mockSend.mockResolvedValue({
      tasks: [],
      failures: [{ reason: 'RESOURCE', detail: 'insufficient capacity' }],
    });

    const launcher = new AwsFargateTaskLauncher(DEFAULT_CONFIG);

    await expect(launcher.launch('ARCA', 'admin')).rejects.toThrow(
      'Failed to launch Fargate task for ARCA: RESOURCE: insufficient capacity',
    );
  });

  it('should set assignPublicIp DISABLED by default', async () => {
    mockSend.mockResolvedValue({
      tasks: [{ taskArn: 'arn:aws:ecs:us-east-1:123:task/t1' }],
    });

    const launcher = new AwsFargateTaskLauncher(DEFAULT_CONFIG);
    await launcher.launch('ARCA', 'admin');

    const command = mockSend.mock.calls[0][0];
    expect(command.networkConfiguration.awsvpcConfiguration.assignPublicIp).toBe('DISABLED');
  });

  it('should set assignPublicIp ENABLED when configured', async () => {
    mockSend.mockResolvedValue({
      tasks: [{ taskArn: 'arn:aws:ecs:us-east-1:123:task/t1' }],
    });

    const launcher = new AwsFargateTaskLauncher({ ...DEFAULT_CONFIG, assignPublicIp: true });
    await launcher.launch('ARCA', 'admin');

    const command = mockSend.mock.calls[0][0];
    expect(command.networkConfiguration.awsvpcConfiguration.assignPublicIp).toBe('ENABLED');
  });
});
