/**
 * AWS ECS adapter for launching Fargate scraper tasks on demand.
 *
 * Uses the ECS RunTask API to start a scraper task with MANUAL disparador.
 * The task definition ARN is resolved per fuente from environment config.
 * Log retrieval uses CloudWatch Logs via the log group wired to the task definition.
 */

import { ECSClient, RunTaskCommand } from '@aws-sdk/client-ecs';
import {
  CloudWatchLogsClient,
  GetLogEventsCommand,
  ResourceNotFoundException,
} from '@aws-sdk/client-cloudwatch-logs';
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
  /** CloudWatch log group name (e.g. /ecs/numerito-prod-scraper) */
  logGroupName?: string;
}

export class AwsFargateTaskLauncher implements FargateTaskLauncherPort {
  private readonly ecs: ECSClient;
  private readonly cwl: CloudWatchLogsClient;
  private readonly config: AwsFargateTaskLauncherConfig;

  constructor(
    config: AwsFargateTaskLauncherConfig,
    ecs?: ECSClient,
    cwl?: CloudWatchLogsClient,
  ) {
    this.config = config;
    this.ecs = ecs ?? new ECSClient({});
    this.cwl = cwl ?? new CloudWatchLogsClient({});
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

  async getLogs(taskId: string, fuente?: FuenteIngesta): Promise<string> {
    if (!this.config.logGroupName) {
      return '(SCRAPER_LOG_GROUP no configurado — no se pueden leer logs de CloudWatch)';
    }

    const logStreamName = this.resolveLogStreamName(taskId, fuente);

    try {
      const response = await this.cwl.send(
        new GetLogEventsCommand({
          logGroupName: this.config.logGroupName,
          logStreamName,
          limit: 500,
          startFromHead: false,
        }),
      );

      const events = response.events ?? [];
      if (events.length === 0) {
        return '(el log stream existe pero aún no tiene eventos — el task puede estar iniciando)';
      }

      return events.map((e) => e.message ?? '').join('');
    } catch (err) {
      if (err instanceof ResourceNotFoundException) {
        return `(el log stream "${logStreamName}" no existe todavía — el task puede estar en estado PENDING)`;
      }
      throw new Error(
        `No se pudieron leer logs de CloudWatch: ${(err as Error).message ?? 'unknown error'}`,
        { cause: err },
      );
    }
  }

  /**
   * ECS awslogs driver creates streams as: {stream-prefix}/{container-name}/{task-id}
   * where stream-prefix = lower(fuente) and container-name = "scraper".
   */
  private resolveLogStreamName(taskId: string, fuente?: string): string {
    const bareTaskId = this.extractTaskId(taskId);
    const prefix = fuente
      ? fuente.toLowerCase()
      : Object.keys(this.config.taskDefinitionArns)[0]?.toLowerCase() ?? 'scraper';

    return `${prefix}/scraper/${bareTaskId}`;
  }

  /** Extracts bare ECS task ID from a full ARN or returns the input as-is. */
  private extractTaskId(taskId: string): string {
    // Full ARN format: arn:aws:ecs:region:account:task/cluster-name/task-id
    const arnMatch = taskId.match(/^arn:aws:ecs:[^:]+:[^:]+:task\/[^/]+\/(.+)$/);
    if (arnMatch) return arnMatch[1];

    // Short ARN format: arn:aws:ecs:region:account:task/task-id
    const shortArnMatch = taskId.match(/^arn:aws:ecs:[^:]+:[^:]+:task\/([^/]+)$/);
    if (shortArnMatch) return shortArnMatch[1];

    return taskId;
  }
}
