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
import { REGLA_VENCIMIENTO_ENTITY_REPOSITORY } from '../obligaciones/domain/repositories/regla-vencimiento.repository';
import type { ReglaVencimientoEntityRepository } from '../obligaciones/domain/repositories/regla-vencimiento.repository';
import { FERIADO_REPOSITORY } from '../obligaciones/domain/repositories/feriado.repository';
import type { FeriadoRepository } from '../obligaciones/domain/repositories/feriado.repository';
import { ObligacionesModule } from '../obligaciones/obligaciones.module';
import { DetectarSugerenciasProrrogaHandler } from '../obligaciones/application/commands/detectar-sugerencias-prorroga.command';
import { SUGERENCIAS_PRORROGA_DETECTOR } from './domain/ports/sugerencias-prorroga-detector.port';
import { CALENDARIO_SCRAPER } from './domain/ports/calendario-scraper.port';
import type { CalendarioScraperPort } from './domain/ports/calendario-scraper.port';
import { FARGATE_TASK_LAUNCHER } from './domain/ports/fargate-task-launcher.port';
import type { FargateTaskLauncherPort } from './domain/ports/fargate-task-launcher.port';
import { AwsFargateTaskLauncher } from './infrastructure/adapters/aws-fargate-task-launcher';
import { DockerTaskLauncher } from './infrastructure/adapters/docker-task-launcher';
import { EjecutarIngestaManualHandler } from './application/commands/ejecutar-ingesta-manual.command';
import { IngestaWebhookGuard } from './infrastructure/guards/ingesta-webhook.guard';
import { AdminOrIngestaGuard } from './infrastructure/guards/admin-or-ingesta.guard';
import { IamModule } from '../iam/iam.module';

@Module({
  imports: [ObligacionesModule, IamModule],
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
        feriadoRepo: FeriadoRepository,
      ) => new ProcesarResultadoScrapingHandler(reglaRepo, ejecucionRepo, configRepo, feriadoRepo),
      inject: [
        REGLA_VENCIMIENTO_ENTITY_REPOSITORY,
        EJECUCION_INGESTA_REPOSITORY,
        CONFIGURACION_INGESTA_REPOSITORY,
        FERIADO_REPOSITORY,
      ],
    },
    {
      provide: EjecucionIngestaListHandler,
      useFactory: (em: EntityManager) => new EjecucionIngestaListHandler(em),
      inject: [EntityManager],
    },

    // ���─ CalendarioScraperPort (null in backend runtime — Fargate tasks push results via POST) ──
    { provide: CALENDARIO_SCRAPER, useValue: null },

    // ── Task launcher for on-demand scraping ──
    // Same port, two adapters: AWS ECS (prod) or local Docker daemon (dev).
    // Choice is driven by env — no code differences between environments.
    {
      provide: FARGATE_TASK_LAUNCHER,
      useFactory: () => {
        const clusterArn = process.env.ECS_CLUSTER_ARN;
        const taskDefArns = process.env.SCRAPER_TASK_DEFINITION_ARNS;
        const subnets = process.env.SCRAPER_SUBNETS;
        const securityGroups = process.env.SCRAPER_SECURITY_GROUPS;

        if (clusterArn && taskDefArns && subnets && securityGroups) {
          return new AwsFargateTaskLauncher({
            clusterArn,
            taskDefinitionArns: JSON.parse(taskDefArns),
            subnets: subnets.split(',').map((s) => s.trim()),
            securityGroups: securityGroups.split(',').map((s) => s.trim()),
            logGroupName: process.env.SCRAPER_LOG_GROUP,
          });
        }

        const scraperImage = process.env.SCRAPER_IMAGE;
        const backendUrl = process.env.SCRAPER_BACKEND_URL;
        const ingestaSecret = process.env.INGESTA_SECRET;
        if (scraperImage && backendUrl && ingestaSecret) {
          return new DockerTaskLauncher({
            image: scraperImage,
            backendUrl,
            ingestaSecret,
            socketPath: process.env.DOCKER_SOCKET_PATH,
          });
        }

        return null;
      },
    },
    // ── Adapter: SugerenciasProrrogaDetectorPort → obligaciones handler ──
    {
      provide: SUGERENCIAS_PRORROGA_DETECTOR,
      useFactory: (handler: DetectarSugerenciasProrrogaHandler) => ({
        detectar: (input: Parameters<DetectarSugerenciasProrrogaHandler['execute']>[0]) =>
          handler.execute(input),
      }),
      inject: [DetectarSugerenciasProrrogaHandler],
    },
    {
      provide: EjecutarIngestaManualHandler,
      useFactory: (
        configRepo: ConfiguracionIngestaRepository,
        ejecucionRepo: EjecucionIngestaRepository,
        procesarHandler: ProcesarResultadoScrapingHandler,
        scraperPort: CalendarioScraperPort | null,
        taskLauncher: FargateTaskLauncherPort | null,
      ) =>
        new EjecutarIngestaManualHandler(
          configRepo,
          ejecucionRepo,
          procesarHandler,
          scraperPort,
          taskLauncher,
        ),
      inject: [
        CONFIGURACION_INGESTA_REPOSITORY,
        EJECUCION_INGESTA_REPOSITORY,
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
