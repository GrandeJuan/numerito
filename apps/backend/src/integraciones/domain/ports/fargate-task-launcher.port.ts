/**
 * Port for launching Fargate scraper tasks on demand.
 * Used by the ejecutar-ahora manual trigger endpoint.
 */

import type { FuenteIngesta } from '../entities/configuracion-ingesta.entity';

export interface LaunchTaskResult {
  taskArn: string;
  fuente: FuenteIngesta;
  launchedAt: string; // ISO datetime
}

export interface LaunchTaskOptions {
  /** Correlation id for the ejecucion_ingesta record already created in EN_CURSO state. */
  ejecucionId: string;
  disparadoPor: string;
}

export interface FargateTaskLauncherPort {
  launch(fuente: FuenteIngesta, options: LaunchTaskOptions): Promise<LaunchTaskResult>;
  /** Retrieves recent stdout/stderr from a running or recently-completed task. */
  getLogs(taskId: string, fuente?: FuenteIngesta): Promise<string>;
}

export const FARGATE_TASK_LAUNCHER = Symbol('FargateTaskLauncher');
