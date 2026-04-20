import { Module } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { NOTIFICACION_FISCAL_REPOSITORY } from './domain/repositories/notificacion-fiscal.repository';
import { CREDENCIAL_FISCAL_REPOSITORY } from './domain/repositories/credencial-fiscal.repository';
import { ORGANISMO_FISCAL_REPOSITORY } from './domain/repositories/organismo-fiscal.repository';
import { CONFIGURACION_INGESTA_REPOSITORY } from './domain/repositories/configuracion-ingesta.repository';
import type { ConfiguracionIngestaRepository } from './domain/repositories/configuracion-ingesta.repository';
import { EJECUCION_INGESTA_REPOSITORY } from './domain/repositories/ejecucion-ingesta.repository';
import type { EjecucionIngestaRepository } from './domain/repositories/ejecucion-ingesta.repository';
import { MikroOrmNotificacionFiscalRepository } from './infrastructure/persistence/mikro-orm-notificacion-fiscal.repository';
import { MikroOrmCredencialFiscalRepository } from './infrastructure/persistence/mikro-orm-credencial-fiscal.repository';
import { MikroOrmOrganismoFiscalRepository } from './infrastructure/persistence/mikro-orm-organismo-fiscal.repository';
import { MikroOrmConfiguracionIngestaRepository } from './infrastructure/persistence/mikro-orm-configuracion-ingesta.repository';
import { MikroOrmEjecucionIngestaRepository } from './infrastructure/persistence/mikro-orm-ejecucion-ingesta.repository';
import { IngestaAdminController } from './infrastructure/controllers/ingesta-admin.controller';
import { IngestaEjecucionController } from './infrastructure/controllers/ingesta-ejecucion.controller';
import { ActualizarConfiguracionIngestaHandler } from './application/commands/actualizar-configuracion-ingesta.command';
import { ProcesarResultadoScrapingHandler } from './application/commands/procesar-resultado-scraping.command';
import { ConfiguracionIngestaListHandler } from './application/queries/configuracion-ingesta-list.query';
import { EjecucionIngestaListHandler } from './application/queries/ejecucion-ingesta-list.query';
import {
  REGLA_VENCIMIENTO_ENTITY_REPOSITORY,
} from '../obligaciones/domain/repositories/regla-vencimiento.repository';
import type {
  ReglaVencimientoEntityRepository,
} from '../obligaciones/domain/repositories/regla-vencimiento.repository';
import { ObligacionesModule } from '../obligaciones/obligaciones.module';
import { CALENDARIO_SCRAPER } from './domain/ports/calendario-scraper.port';
import type { CalendarioScraperPort } from './domain/ports/calendario-scraper.port';
import { FARGATE_TASK_LAUNCHER } from './domain/ports/fargate-task-launcher.port';
import type { FargateTaskLauncherPort } from './domain/ports/fargate-task-launcher.port';
import { AwsFargateTaskLauncher } from './infrastructure/adapters/aws-fargate-task-launcher';
import { EjecutarIngestaManualHandler } from './application/commands/ejecutar-ingesta-manual.command';
import { IngestaWebhookGuard } from './infrastructure/guards/ingesta-webhook.guard';
import { AdminOrIngestaGuard } from './infrastructure/guards/admin-or-ingesta.guard';

@Module({
  imports: [ObligacionesModule],
  controllers: [IngestaAdminController, IngestaEjecucionController],
  providers: [
    // ── Guards ──
    IngestaWebhookGuard,
    AdminOrIngestaGuard,

    // ── Existing repositories ──
    { provide: NOTIFICACION_FISCAL_REPOSITORY, useClass: MikroOrmNotificacionFiscalRepository },
    { provide: CREDENCIAL_FISCAL_REPOSITORY, useClass: MikroOrmCredencialFiscalRepository },
    { provide: ORGANISMO_FISCAL_REPOSITORY, useClass: MikroOrmOrganismoFiscalRepository },

    // ── Configuración Ingesta ──
    { provide: CONFIGURACION_INGESTA_REPOSITORY, useClass: MikroOrmConfiguracionIngestaRepository },
    {
      provide: ActualizarConfiguracionIngestaHandler,
      useFactory: (repo: ConfiguracionIngestaRepository) =>
        new ActualizarConfiguracionIngestaHandler(repo),
      inject: [CONFIGURACION_INGESTA_REPOSITORY],
    },
    {
      provide: ConfiguracionIngestaListHandler,
      useFactory: (em: EntityManager) => new ConfiguracionIngestaListHandler(em),
      inject: [EntityManager],
    },

    // ── Ejecución Ingesta ──
    { provide: EJECUCION_INGESTA_REPOSITORY, useClass: MikroOrmEjecucionIngestaRepository },
    {
      provide: ProcesarResultadoScrapingHandler,
      useFactory: (
        reglaRepo: ReglaVencimientoEntityRepository,
        ejecucionRepo: EjecucionIngestaRepository,
        configRepo: ConfiguracionIngestaRepository,
      ) => new ProcesarResultadoScrapingHandler(reglaRepo, ejecucionRepo, configRepo),
      inject: [
        REGLA_VENCIMIENTO_ENTITY_REPOSITORY,
        EJECUCION_INGESTA_REPOSITORY,
        CONFIGURACION_INGESTA_REPOSITORY,
      ],
    },
    {
      provide: EjecucionIngestaListHandler,
      useFactory: (em: EntityManager) => new EjecucionIngestaListHandler(em),
      inject: [EntityManager],
    },

    // ���─ CalendarioScraperPort (null in backend runtime — Fargate tasks push results via POST) ──
    { provide: CALENDARIO_SCRAPER, useValue: null },

    // ── FargateTaskLauncher (launches ECS RunTask for on-demand scraping) ──
    {
      provide: FARGATE_TASK_LAUNCHER,
      useFactory: () => {
        const clusterArn = process.env.ECS_CLUSTER_ARN;
        const taskDefArns = process.env.SCRAPER_TASK_DEFINITION_ARNS; // JSON: {"ARCA":"arn:..."}
        const subnets = process.env.SCRAPER_SUBNETS; // comma-separated
        const securityGroups = process.env.SCRAPER_SECURITY_GROUPS; // comma-separated

        if (!clusterArn || !taskDefArns || !subnets || !securityGroups) {
          return null; // Fargate triggering not configured in this environment
        }

        return new AwsFargateTaskLauncher({
          clusterArn,
          taskDefinitionArns: JSON.parse(taskDefArns),
          subnets: subnets.split(',').map((s) => s.trim()),
          securityGroups: securityGroups.split(',').map((s) => s.trim()),
        });
      },
    },
    {
      provide: EjecutarIngestaManualHandler,
      useFactory: (
        configRepo: ConfiguracionIngestaRepository,
        procesarHandler: ProcesarResultadoScrapingHandler,
        scraperPort: CalendarioScraperPort | null,
        taskLauncher: FargateTaskLauncherPort | null,
      ) => new EjecutarIngestaManualHandler(configRepo, procesarHandler, scraperPort, taskLauncher),
      inject: [
        CONFIGURACION_INGESTA_REPOSITORY,
        ProcesarResultadoScrapingHandler,
        CALENDARIO_SCRAPER,
        FARGATE_TASK_LAUNCHER,
      ],
    },
  ],
  exports: [
    NOTIFICACION_FISCAL_REPOSITORY,
    CREDENCIAL_FISCAL_REPOSITORY,
    ORGANISMO_FISCAL_REPOSITORY,
    CONFIGURACION_INGESTA_REPOSITORY,
    EJECUCION_INGESTA_REPOSITORY,
  ],
})
export class IntegracionesModule {}
