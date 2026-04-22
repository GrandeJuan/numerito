import { DockerTaskLauncher, DockerTaskLauncherConfig } from './docker-task-launcher';

// ---------------------------------------------------------------------------
// Mocks — replicate dockerode's interface just enough for the adapter tests.
// ---------------------------------------------------------------------------
const mockInspect = jest.fn();
const mockGetImage = jest.fn().mockReturnValue({ inspect: mockInspect });

const mockStart = jest.fn();
const mockCreateContainer = jest.fn().mockResolvedValue({
  id: 'abc123deadbeef',
  start: mockStart,
});
const mockContainerLogs = jest.fn();
const mockContainerRemove = jest.fn();
const mockGetContainer = jest.fn().mockReturnValue({
  logs: mockContainerLogs,
  remove: mockContainerRemove,
});
const mockListContainers = jest.fn().mockResolvedValue([]);

jest.mock('dockerode', () => {
  return jest.fn().mockImplementation(() => ({
    getImage: mockGetImage,
    createContainer: mockCreateContainer,
    getContainer: mockGetContainer,
    listContainers: mockListContainers,
  }));
});

const DEFAULT_CONFIG: DockerTaskLauncherConfig = {
  image: 'numerito-scraper:latest',
  backendUrl: 'http://host.docker.internal:5101',
  ingestaSecret: 'test-secret',
};

const DEFAULT_OPTIONS = {
  ejecucionId: 'ej-1',
  disparadoPor: 'admin-user',
};

describe('DockerTaskLauncher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: image exists
    mockInspect.mockResolvedValue({});
    mockStart.mockResolvedValue(undefined);
    mockCreateContainer.mockResolvedValue({
      id: 'abc123deadbeef',
      start: mockStart,
    });
  });

  // -----------------------------------------------------------------------
  // launch()
  // -----------------------------------------------------------------------
  describe('launch', () => {
    it('should check image exists, create container, start it, and return result', async () => {
      const launcher = new DockerTaskLauncher(DEFAULT_CONFIG);
      const result = await launcher.launch('ARCA', DEFAULT_OPTIONS);

      expect(mockGetImage).toHaveBeenCalledWith('numerito-scraper:latest');
      expect(mockInspect).toHaveBeenCalled();
      expect(mockCreateContainer).toHaveBeenCalledWith(
        expect.objectContaining({
          Image: 'numerito-scraper:latest',
          Labels: { 'numerito.kind': 'scraper' },
        }),
      );
      expect(mockStart).toHaveBeenCalled();
      expect(result.taskArn).toBe('docker://abc123deadbeef');
      expect(result.fuente).toBe('ARCA');
      expect(result.launchedAt).toBeDefined();
    });

    it('should pass correct environment variables to the container', async () => {
      const launcher = new DockerTaskLauncher(DEFAULT_CONFIG);
      await launcher.launch('ARBA', {
        ejecucionId: 'ej-99',
        disparadoPor: 'user-77',
      });

      const createCall = mockCreateContainer.mock.calls[0][0];
      expect(createCall.Env).toEqual([
        'BACKEND_URL=http://host.docker.internal:5101',
        'INGESTA_SECRET=test-secret',
        'FUENTE=ARBA',
        'DISPARADOR=MANUAL',
        'DISPARADO_POR=user-77',
        'EJECUCION_ID=ej-99',
      ]);
    });

    it('should set ExtraHosts for host.docker.internal', async () => {
      const launcher = new DockerTaskLauncher(DEFAULT_CONFIG);
      await launcher.launch('ARCA', DEFAULT_OPTIONS);

      const createCall = mockCreateContainer.mock.calls[0][0];
      expect(createCall.HostConfig.ExtraHosts).toEqual(['host.docker.internal:host-gateway']);
    });

    it('should throw actionable error when image does not exist', async () => {
      mockInspect.mockRejectedValue({ statusCode: 404, message: 'No such image' });

      const launcher = new DockerTaskLauncher(DEFAULT_CONFIG);

      await expect(launcher.launch('ARCA', DEFAULT_OPTIONS)).rejects.toThrow(
        'La imagen "numerito-scraper:latest" no existe en el daemon Docker',
      );
      await expect(launcher.launch('ARCA', DEFAULT_OPTIONS)).rejects.toThrow(
        'docker compose build scraper-image',
      );
      expect(mockCreateContainer).not.toHaveBeenCalled();
    });

    it('should rethrow non-404 errors from image inspect', async () => {
      const err = new Error('Docker daemon unavailable');
      mockInspect.mockRejectedValue(err);

      const launcher = new DockerTaskLauncher(DEFAULT_CONFIG);

      await expect(launcher.launch('ARCA', DEFAULT_OPTIONS)).rejects.toThrow(
        'Docker daemon unavailable',
      );
    });

    it('should prune old containers (best-effort) before creating new one', async () => {
      const oldContainer = {
        Id: 'old-container-id',
        Created: Math.floor(Date.now() / 1000) - 48 * 60 * 60, // 48h ago
      };
      mockListContainers.mockResolvedValue([oldContainer]);
      mockContainerRemove.mockResolvedValue(undefined);

      const launcher = new DockerTaskLauncher(DEFAULT_CONFIG);
      await launcher.launch('ARCA', DEFAULT_OPTIONS);

      expect(mockListContainers).toHaveBeenCalledWith({
        all: true,
        filters: { label: ['numerito.kind=scraper'], status: ['exited', 'dead'] },
      });
      expect(mockGetContainer).toHaveBeenCalledWith('old-container-id');
      expect(mockContainerRemove).toHaveBeenCalledWith({ force: true });
    });

    it('should not fail if pruning throws', async () => {
      mockListContainers.mockRejectedValue(new Error('list failed'));

      const launcher = new DockerTaskLauncher(DEFAULT_CONFIG);
      const result = await launcher.launch('ARCA', DEFAULT_OPTIONS);

      expect(result.taskArn).toBe('docker://abc123deadbeef');
    });
  });

  // -----------------------------------------------------------------------
  // getLogs()
  // -----------------------------------------------------------------------
  describe('getLogs', () => {
    it('should return logs from a container by docker:// prefixed id', async () => {
      // Simulate non-multiplexed (tty) log output
      mockContainerLogs.mockResolvedValue(Buffer.from('line 1\nline 2\n'));

      const launcher = new DockerTaskLauncher(DEFAULT_CONFIG);
      const logs = await launcher.getLogs('docker://container-xyz');

      expect(mockGetContainer).toHaveBeenCalledWith('container-xyz');
      expect(mockContainerLogs).toHaveBeenCalledWith({
        stdout: true,
        stderr: true,
        tail: 500,
        timestamps: true,
        follow: false,
      });
      expect(logs).toBe('line 1\nline 2\n');
    });

    it('should handle raw container id without docker:// prefix', async () => {
      mockContainerLogs.mockResolvedValue(Buffer.from('output'));

      const launcher = new DockerTaskLauncher(DEFAULT_CONFIG);
      await launcher.getLogs('raw-container-id');

      expect(mockGetContainer).toHaveBeenCalledWith('raw-container-id');
    });

    it('should return human-friendly message when container no longer exists', async () => {
      mockContainerLogs.mockRejectedValue({ statusCode: 404, message: 'not found' });

      const launcher = new DockerTaskLauncher(DEFAULT_CONFIG);
      const logs = await launcher.getLogs('docker://gone');

      expect(logs).toContain('el container ya no existe');
    });

    it('should throw on non-404 log errors', async () => {
      mockContainerLogs.mockRejectedValue({
        statusCode: 500,
        message: 'internal error',
      });

      const launcher = new DockerTaskLauncher(DEFAULT_CONFIG);

      await expect(launcher.getLogs('docker://broken')).rejects.toThrow(
        'No se pudieron leer logs: internal error',
      );
    });

    it('should strip Docker multiplexed log headers', async () => {
      // Build a multiplexed log buffer: stdout header (type=1) + payload "hello\n"
      const payload = Buffer.from('hello\n');
      const header = Buffer.alloc(8);
      header.writeUInt8(1, 0); // stdout stream
      header.writeUInt32BE(payload.length, 4);
      const multiplexed = Buffer.concat([header, payload]);

      mockContainerLogs.mockResolvedValue(multiplexed);

      const launcher = new DockerTaskLauncher(DEFAULT_CONFIG);
      const logs = await launcher.getLogs('docker://mux-container');

      expect(logs).toBe('hello\n');
    });
  });
});
