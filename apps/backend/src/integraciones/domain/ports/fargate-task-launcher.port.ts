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

export interface FargateTaskLauncherPort {
  launch(fuente: FuenteIngesta, disparadoPor: string): Promise<LaunchTaskResult>;
}

export const FARGATE_TASK_LAUNCHER = Symbol('FargateTaskLauncher');
