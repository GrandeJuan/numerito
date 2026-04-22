/**
 * Docker adapter for launching scraper containers.
 *
 * Dev/local mirror of AwsFargateTaskLauncher: same port, same contract.
 * Spawns a one-shot container using the local Docker daemon (via the engine
 * socket) instead of ECS. Used when the backend runs outside AWS but still
 * needs to trigger real Playwright-based scraping end-to-end.
 */

import Docker from 'dockerode';
import type {
  FargateTaskLauncherPort,
  LaunchTaskOptions,
  LaunchTaskResult,
} from '../../domain/ports/fargate-task-launcher.port';
import type { FuenteIngesta } from '../../domain/entities/configuracion-ingesta.entity';

export interface DockerTaskLauncherConfig {
  /** Image tag of the scraper (same Dockerfile as infra/fargate-scraper). */
  image: string;
  /** URL the container uses to POST the resultado back. Reachable from inside Docker. */
  backendUrl: string;
  /** Shared secret for the webhook auth. */
  ingestaSecret: string;
  /** Docker socket path (unix) or host (windows named pipe handled by dockerode defaults). */
  socketPath?: string;
}

export class DockerTaskLauncher implements FargateTaskLauncherPort {
  private readonly docker: Docker;
  private readonly config: DockerTaskLauncherConfig;

  constructor(config: DockerTaskLauncherConfig, docker?: Docker) {
    this.config = config;
    this.docker =
      docker ?? new Docker(config.socketPath ? { socketPath: config.socketPath } : undefined);
  }

  async launch(fuente: FuenteIngesta, options: LaunchTaskOptions): Promise<LaunchTaskResult> {
    await this.ensureImageExists();

    const env = [
      `BACKEND_URL=${this.config.backendUrl}`,
      `INGESTA_SECRET=${this.config.ingestaSecret}`,
      `FUENTE=${fuente}`,
      `DISPARADOR=MANUAL`,
      `DISPARADO_POR=${options.disparadoPor}`,
      `EJECUCION_ID=${options.ejecucionId}`,
    ];

    // Best-effort cleanup of old finished containers on each launch (keeps last 24h
    // available for log inspection, discards older ones so docker doesn't accumulate).
    await this.pruneOldContainers().catch(() => {});

    const container = await this.docker.createContainer({
      Image: this.config.image,
      Env: env,
      Labels: { 'numerito.kind': 'scraper' },
      HostConfig: {
        // Do NOT auto-remove: keep the stopped container around so getLogs()
        // can read its stdout/stderr after the scrape finishes.
        ExtraHosts: ['host.docker.internal:host-gateway'],
      },
    });

    await container.start();

    return {
      taskArn: `docker://${container.id}`,
      fuente,
      launchedAt: new Date().toISOString(),
    };
  }

  private async ensureImageExists(): Promise<void> {
    try {
      await this.docker.getImage(this.config.image).inspect();
    } catch (err) {
      if ((err as { statusCode?: number }).statusCode === 404) {
        throw new Error(
          `La imagen "${this.config.image}" no existe en el daemon Docker. ` +
            `Ejecutá "docker compose build scraper-image" para construirla.`,
        );
      }
      throw err;
    }
  }

  private async pruneOldContainers(): Promise<void> {
    const cutoff = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
    const containers = await this.docker.listContainers({
      all: true,
      filters: { label: ['numerito.kind=scraper'], status: ['exited', 'dead'] },
    });
    await Promise.all(
      containers
        .filter((c) => c.Created < cutoff)
        .map((c) =>
          this.docker
            .getContainer(c.Id)
            .remove({ force: true })
            .catch(() => {}),
        ),
    );
  }

  async getLogs(taskId: string): Promise<string> {
    const containerId = taskId.startsWith('docker://') ? taskId.slice('docker://'.length) : taskId;
    const container = this.docker.getContainer(containerId);
    try {
      const buf = (await container.logs({
        stdout: true,
        stderr: true,
        tail: 500,
        timestamps: true,
        follow: false,
      })) as Buffer;
      return stripDockerLogHeaders(buf);
    } catch (err) {
      const msg = (err as { statusCode?: number; message?: string }).message ?? 'unknown error';
      if ((err as { statusCode?: number }).statusCode === 404) {
        return '(el container ya no existe — los logs se descartaron al terminar)';
      }
      throw new Error(`No se pudieron leer logs: ${msg}`, { cause: err });
    }
  }
}

/**
 * Docker's multiplexed log stream prefixes each line with an 8-byte header:
 *   [stream_type, 0, 0, 0, size0, size1, size2, size3]
 * Strip those so the UI sees plain text.
 */
function stripDockerLogHeaders(buf: Buffer): string {
  const chunks: string[] = [];
  let offset = 0;
  while (offset + 8 <= buf.length) {
    const size = buf.readUInt32BE(offset + 4);
    const start = offset + 8;
    const end = start + size;
    if (end > buf.length) break;
    chunks.push(buf.slice(start, end).toString('utf8'));
    offset = end;
  }
  // Fallback: if stream isn't multiplexed (e.g. tty mode), return raw.
  return chunks.length > 0 ? chunks.join('') : buf.toString('utf8');
}
