/**
 * AWS ECS adapter for launching Fargate scraper tasks on demand.
 *
 * Uses the ECS RunTask API to start a scraper task with MANUAL disparador.
 * The task definition ARN is resolved per fuente from environment config.
 */

import { ECSClient, RunTaskCommand } from '@aws-sdk/client-ecs';
import type {
  FargateTaskLauncherPort,
  LaunchTaskOptions,
  LaunchTaskResult,
} from '../../domain/ports/fargate-task-launcher.port';
import type { FuenteIngesta } from '../../domain/entities/configuracion-ingesta.entity';

export interface AwsFargateTaskLauncherConfig {
  /** Map of fuente → ECS task definition ARN */
  taskDefinitionArns: Record<string, string>;
  clusterArn: string;
  subnets: string[];
  securityGroups: string[];
  assignPublicIp?: boolean;
}

export class AwsFargateTaskLauncher implements FargateTaskLauncherPort {
  private readonly ecs: ECSClient;
  private readonly config: AwsFargateTaskLauncherConfig;

  constructor(config: AwsFargateTaskLauncherConfig, ecs?: ECSClient) {
    this.config = config;
    this.ecs = ecs ?? new ECSClient({});
  }

  async launch(fuente: FuenteIngesta, options: LaunchTaskOptions): Promise<LaunchTaskResult> {
    const taskDefinition = this.config.taskDefinitionArns[fuente];
    if (!taskDefinition) {
      throw new Error(`No task definition configured for fuente: ${fuente}`);
    }

    const result = await this.ecs.send(
      new RunTaskCommand({
        cluster: this.config.clusterArn,
        taskDefinition,
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration: {
          awsvpcConfiguration: {
            subnets: this.config.subnets,
            securityGroups: this.config.securityGroups,
            assignPublicIp: this.config.assignPublicIp ? 'ENABLED' : 'DISABLED',
          },
        },
        overrides: {
          containerOverrides: [
            {
              name: 'scraper',
              environment: [
                { name: 'DISPARADOR', value: 'MANUAL' },
                { name: 'DISPARADO_POR', value: options.disparadoPor },
                { name: 'EJECUCION_ID', value: options.ejecucionId },
              ],
            },
          ],
        },
      }),
    );

    const taskArn = result.tasks?.[0]?.taskArn;
    if (!taskArn) {
      const failures = result.failures?.map((f) => `${f.reason}: ${f.detail}`).join('; ');
      throw new Error(
        `Failed to launch Fargate task for ${fuente}: ${failures || 'unknown error'}`,
      );
    }

    return {
      taskArn,
      fuente,
      launchedAt: new Date().toISOString(),
    };
  }

  async getLogs(_taskId: string): Promise<string> {
    // TODO: implement via CloudWatch Logs `GetLogEvents` using the log group
    // wired to the task definition. Not needed for dev — the DockerTaskLauncher
    // covers that path.
    return '(log streaming desde ECS/CloudWatch no implementado todavía)';
  }
}
