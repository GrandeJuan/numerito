import { Module, forwardRef } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { ObligacionesController } from './infrastructure/controllers/obligaciones.controller';
import { CatalogoAdminController } from './infrastructure/controllers/catalogo-admin.controller';
import { RecordatoriosController } from './infrastructure/controllers/recordatorios.controller';
import { ReglasPropuestasController } from './infrastructure/controllers/reglas-propuestas.controller';
import { VENCIMIENTO_REPOSITORY } from './domain/repositories/vencimiento.repository';
import type { VencimientoRepository } from './domain/repositories/vencimiento.repository';
import { CATALOGO_OBLIGACION_REPOSITORY } from './domain/repositories/catalogo-obligacion.repository';
import type { CatalogoObligacionRepository } from './domain/repositories/catalogo-obligacion.repository';
import {
  REGLA_VENCIMIENTO_ENTITY_REPOSITORY,
} from './domain/repositories/regla-vencimiento.repository';
import type {
  ReglaVencimientoEntityRepository,
} from './domain/repositories/regla-vencimiento.repository';
import { ClientesModule } from '../clientes/clientes.module';
import { CLIENTE_REPOSITORY } from '../clientes/domain/repositories/cliente.repository';
import type { ClienteRepository } from '../clientes/domain/repositories/cliente.repository';
import { MikroOrmVencimientoRepository } from './infrastructure/persistence/mikro-orm-vencimiento.repository';
import { MikroOrmCatalogoObligacionRepository } from './infrastructure/persistence/mikro-orm-catalogo-obligacion.repository';
import { MikroOrmReglaVencimientoRepository } from './infrastructure/persistence/mikro-orm-regla-vencimiento.repository';
import { MikroOrmFeriadoRepository } from './infrastructure/persistence/mikro-orm-feriado.repository';
import { MikroOrmRecordatorioEnviadoRepository } from './infrastructure/persistence/mikro-orm-recordatorio-enviado.repository';
import { MikroOrmAlertaConfigRepository } from './infrastructure/persistence/mikro-orm-alerta-config.repository';
import { RECORDATORIO_ENVIADO_REPOSITORY } from './domain/repositories/recordatorio-enviado.repository';
import type { RecordatorioEnviadoRepository } from './domain/repositories/recordatorio-enviado.repository';
import { ALERTA_CONFIG_REPOSITORY } from './domain/repositories/alerta-config.repository';
import type { AlertaConfigRepository } from './domain/repositories/alerta-config.repository';
import { ProcesarRecordatoriosDiariosHandler } from './application/commands/procesar-recordatorios-diarios.command';
import { ProcesarAlertasEnRiesgoHandler } from './application/commands/procesar-alertas-en-riesgo.command';
import { NOTIFICACION_REPOSITORY } from '../notificaciones/domain/repositories/notificacion.repository';
import type { NotificacionRepository } from '../notificaciones/domain/repositories/notificacion.repository';
import { MAIL_SENDER } from '../shared/domain/ports/mail-sender.port';
import type { MailSenderPort } from '../shared/domain/ports/mail-sender.port';
import { ConsoleMailSender } from '../shared/infrastructure/adapters/console-mail-sender';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { ReglaVencimientoService } from './domain/services/regla-vencimiento.service';
import { AjusteDiaHabilService } from './domain/services/ajuste-dia-habil.service';
import { FERIADO_REPOSITORY } from './domain/repositories/feriado.repository';
import type { FeriadoRepository } from './domain/repositories/feriado.repository';
import { CrearVencimientoHandler } from './application/commands/crear-vencimiento.command';
import { PresentarVencimientoHandler } from './application/commands/presentar-vencimiento.command';
import { MarcarVencidoHandler } from './application/commands/marcar-vencido.command';
import { ProrrogarVencimientoHandler } from './application/commands/prorrogar-vencimiento.command';
import { MarcarNoAplicaHandler } from './application/commands/marcar-no-aplica.command';
import { ReasignarResponsableHandler } from './application/commands/reasignar-responsable.command';
import { CrearCatalogoObligacionHandler } from './application/commands/crear-catalogo-obligacion.command';
import { ActualizarCatalogoObligacionHandler } from './application/commands/actualizar-catalogo-obligacion.command';
import { CrearReglaVencimientoHandler } from './application/commands/crear-regla-vencimiento.command';
import { ActualizarReglaVencimientoHandler } from './application/commands/actualizar-regla-vencimiento.command';
import { AprobarReglaPropuestaHandler } from './application/commands/aprobar-regla-propuesta.command';
import { RechazarReglaPropuestaHandler } from './application/commands/rechazar-regla-propuesta.command';
import { AprobarReglasBloqueHandler } from './application/commands/aprobar-reglas-bloque.command';
import { ProyectarCalendarioMensualHandler } from './application/commands/proyectar-calendario-mensual.command';
import { ProyectarCalendarioMasivoHandler } from './application/commands/proyectar-calendario-masivo.command';
import { VencimientoKpisHandler } from './application/queries/vencimiento-kpis.query';
import { VencimientoListHandler } from './application/queries/vencimiento-list.query';
import { VencimientoCalendarioHandler } from './application/queries/vencimiento-calendario.query';
import { VencimientoByIdHandler } from './application/queries/vencimiento-by-id.query';
import { CatalogoObligacionListHandler } from './application/queries/catalogo-obligacion-list.query';
import { ReglaVencimientoListHandler } from './application/queries/regla-vencimiento-list.query';
import { ReglasPropuestasListHandler } from './application/queries/reglas-propuestas-list.query';
import { VencimientosProximosView } from './application/views/vencimientos-proximos.view';
import { VencimientosPendientesClienteView } from './application/views/vencimientos-pendientes-cliente.view';
import { VencimientosPorEstadoView } from './application/views/vencimientos-por-estado.view';
import { ProximosVencimientosDetalleView } from './application/views/proximos-vencimientos-detalle.view';
import { VencimientosRecientesClienteView } from './application/views/vencimientos-recientes-cliente.view';
import {
  VENCIMIENTOS_PROXIMOS_VIEW,
  VENCIMIENTOS_PENDIENTES_CLIENTE_VIEW,
  VENCIMIENTOS_POR_ESTADO_VIEW,
  PROXIMOS_VENCIMIENTOS_DETALLE_VIEW,
  VENCIMIENTOS_RECIENTES_CLIENTE_VIEW,
  ACTIVIDAD_RECIENTE_VENCIMIENTOS_VIEW,
} from './application/public-views';
import { ActividadRecienteVencimientosView } from './application/views/actividad-reciente-vencimientos.view';
import type { EventBus } from '../shared/domain/event-bus';
import { EVENT_BUS } from '../shared/domain/event-bus';

@Module({
  imports: [forwardRef(() => ClientesModule), NotificacionesModule],
  controllers: [ObligacionesController, CatalogoAdminController, RecordatoriosController, ReglasPropuestasController],
  providers: [
    // ── Repositories ──
    { provide: VENCIMIENTO_REPOSITORY, useClass: MikroOrmVencimientoRepository },
    { provide: CATALOGO_OBLIGACION_REPOSITORY, useClass: MikroOrmCatalogoObligacionRepository },
    { provide: REGLA_VENCIMIENTO_ENTITY_REPOSITORY, useClass: MikroOrmReglaVencimientoRepository },
    { provide: FERIADO_REPOSITORY, useClass: MikroOrmFeriadoRepository },
    { provide: RECORDATORIO_ENVIADO_REPOSITORY, useClass: MikroOrmRecordatorioEnviadoRepository },
    { provide: ALERTA_CONFIG_REPOSITORY, useClass: MikroOrmAlertaConfigRepository },
    { provide: MAIL_SENDER, useClass: ConsoleMailSender },

    // ── Domain services ──
    {
      provide: ReglaVencimientoService,
      useFactory: (entityRepo: ReglaVencimientoEntityRepository) =>
        new ReglaVencimientoService(entityRepo),
      inject: [REGLA_VENCIMIENTO_ENTITY_REPOSITORY],
    },

    {
      provide: AjusteDiaHabilService,
      useFactory: (feriadoRepo: FeriadoRepository) =>
        new AjusteDiaHabilService(feriadoRepo),
      inject: [FERIADO_REPOSITORY],
    },

    // ── Vencimiento commands ──
    {
      provide: CrearVencimientoHandler,
      useFactory: (repo: VencimientoRepository) =>
        new CrearVencimientoHandler(repo),
      inject: [VENCIMIENTO_REPOSITORY],
    },
    {
      provide: PresentarVencimientoHandler,
      useFactory: (repo: VencimientoRepository, eventBus: EventBus) =>
        new PresentarVencimientoHandler(repo, eventBus),
      inject: [VENCIMIENTO_REPOSITORY, EVENT_BUS],
    },
    {
      provide: MarcarVencidoHandler,
      useFactory: (repo: VencimientoRepository, eventBus: EventBus) =>
        new MarcarVencidoHandler(repo, eventBus),
      inject: [VENCIMIENTO_REPOSITORY, EVENT_BUS],
    },
    {
      provide: ProrrogarVencimientoHandler,
      useFactory: (repo: VencimientoRepository, eventBus: EventBus) =>
        new ProrrogarVencimientoHandler(repo, eventBus),
      inject: [VENCIMIENTO_REPOSITORY, EVENT_BUS],
    },
    {
      provide: MarcarNoAplicaHandler,
      useFactory: (repo: VencimientoRepository) =>
        new MarcarNoAplicaHandler(repo),
      inject: [VENCIMIENTO_REPOSITORY],
    },

    {
      provide: ReasignarResponsableHandler,
      useFactory: (vencimientoRepo: VencimientoRepository, clienteRepo: ClienteRepository) =>
        new ReasignarResponsableHandler(vencimientoRepo, clienteRepo),
      inject: [VENCIMIENTO_REPOSITORY, CLIENTE_REPOSITORY],
    },

    // ── Proyector ──
    {
      provide: ProyectarCalendarioMensualHandler,
      useFactory: (
        vencimientoRepo: VencimientoRepository,
        clienteRepo: ClienteRepository,
        catalogoRepo: CatalogoObligacionRepository,
        reglaService: ReglaVencimientoService,
        ajusteService: AjusteDiaHabilService,
        eventBus: EventBus,
      ) =>
        new ProyectarCalendarioMensualHandler(
          vencimientoRepo,
          clienteRepo,
          catalogoRepo,
          reglaService,
          ajusteService,
          eventBus,
        ),
      inject: [
        VENCIMIENTO_REPOSITORY,
        CLIENTE_REPOSITORY,
        CATALOGO_OBLIGACION_REPOSITORY,
        ReglaVencimientoService,
        AjusteDiaHabilService,
        EVENT_BUS,
      ],
    },

    // ── Masivo ──
    {
      provide: ProyectarCalendarioMasivoHandler,
      useFactory: (
        clienteRepo: ClienteRepository,
        proyectarHandler: ProyectarCalendarioMensualHandler,
        eventBus: EventBus,
      ) =>
        new ProyectarCalendarioMasivoHandler(clienteRepo, proyectarHandler, eventBus),
      inject: [CLIENTE_REPOSITORY, ProyectarCalendarioMensualHandler, EVENT_BUS],
    },

    // ── Recordatorios ──
    {
      provide: ProcesarRecordatoriosDiariosHandler,
      useFactory: (
        alertaConfigRepo: AlertaConfigRepository,
        vencimientoRepo: VencimientoRepository,
        clienteRepo: ClienteRepository,
        recordatorioRepo: RecordatorioEnviadoRepository,
        notificacionRepo: NotificacionRepository,
        mailSender: MailSenderPort,
      ) =>
        new ProcesarRecordatoriosDiariosHandler(
          alertaConfigRepo,
          vencimientoRepo,
          clienteRepo,
          recordatorioRepo,
          notificacionRepo,
          mailSender,
        ),
      inject: [
        ALERTA_CONFIG_REPOSITORY,
        VENCIMIENTO_REPOSITORY,
        CLIENTE_REPOSITORY,
        RECORDATORIO_ENVIADO_REPOSITORY,
        NOTIFICACION_REPOSITORY,
        MAIL_SENDER,
      ],
    },
    {
      provide: ProcesarAlertasEnRiesgoHandler,
      useFactory: (
        alertaConfigRepo: AlertaConfigRepository,
        vencimientoRepo: VencimientoRepository,
        recordatorioRepo: RecordatorioEnviadoRepository,
        notificacionRepo: NotificacionRepository,
      ) =>
        new ProcesarAlertasEnRiesgoHandler(
          alertaConfigRepo,
          vencimientoRepo,
          recordatorioRepo,
          notificacionRepo,
        ),
      inject: [
        ALERTA_CONFIG_REPOSITORY,
        VENCIMIENTO_REPOSITORY,
        RECORDATORIO_ENVIADO_REPOSITORY,
        NOTIFICACION_REPOSITORY,
      ],
    },

    // ── Catálogo/Regla commands ──
    {
      provide: CrearCatalogoObligacionHandler,
      useFactory: (repo: CatalogoObligacionRepository) =>
        new CrearCatalogoObligacionHandler(repo),
      inject: [CATALOGO_OBLIGACION_REPOSITORY],
    },
    {
      provide: ActualizarCatalogoObligacionHandler,
      useFactory: (repo: CatalogoObligacionRepository) =>
        new ActualizarCatalogoObligacionHandler(repo),
      inject: [CATALOGO_OBLIGACION_REPOSITORY],
    },
    {
      provide: CrearReglaVencimientoHandler,
      useFactory: (repo: ReglaVencimientoEntityRepository, svc: ReglaVencimientoService) =>
        new CrearReglaVencimientoHandler(repo, svc),
      inject: [REGLA_VENCIMIENTO_ENTITY_REPOSITORY, ReglaVencimientoService],
    },
    {
      provide: ActualizarReglaVencimientoHandler,
      useFactory: (repo: ReglaVencimientoEntityRepository) =>
        new ActualizarReglaVencimientoHandler(repo),
      inject: [REGLA_VENCIMIENTO_ENTITY_REPOSITORY],
    },

    // ── Propuestas (approval/rejection) ──
    {
      provide: AprobarReglaPropuestaHandler,
      useFactory: (repo: ReglaVencimientoEntityRepository) =>
        new AprobarReglaPropuestaHandler(repo),
      inject: [REGLA_VENCIMIENTO_ENTITY_REPOSITORY],
    },
    {
      provide: RechazarReglaPropuestaHandler,
      useFactory: (repo: ReglaVencimientoEntityRepository) =>
        new RechazarReglaPropuestaHandler(repo),
      inject: [REGLA_VENCIMIENTO_ENTITY_REPOSITORY],
    },
    {
      provide: AprobarReglasBloqueHandler,
      useFactory: (aprobarHandler: AprobarReglaPropuestaHandler) =>
        new AprobarReglasBloqueHandler(aprobarHandler),
      inject: [AprobarReglaPropuestaHandler],
    },

    // ── Vencimiento queries ──
    {
      provide: VencimientoKpisHandler,
      useFactory: (em: EntityManager) => new VencimientoKpisHandler(em),
      inject: [EntityManager],
    },
    {
      provide: VencimientoListHandler,
      useFactory: (em: EntityManager) => new VencimientoListHandler(em),
      inject: [EntityManager],
    },
    {
      provide: VencimientoCalendarioHandler,
      useFactory: (em: EntityManager) => new VencimientoCalendarioHandler(em),
      inject: [EntityManager],
    },
    {
      provide: VencimientoByIdHandler,
      useFactory: (em: EntityManager) => new VencimientoByIdHandler(em),
      inject: [EntityManager],
    },

    // ── Catálogo/Regla queries ──
    {
      provide: CatalogoObligacionListHandler,
      useFactory: (em: EntityManager) => new CatalogoObligacionListHandler(em),
      inject: [EntityManager],
    },
    {
      provide: ReglaVencimientoListHandler,
      useFactory: (em: EntityManager) => new ReglaVencimientoListHandler(em),
      inject: [EntityManager],
    },
    {
      provide: ReglasPropuestasListHandler,
      useFactory: (em: EntityManager) => new ReglasPropuestasListHandler(em),
      inject: [EntityManager],
    },

    // ── Views ──
    {
      provide: VENCIMIENTOS_PROXIMOS_VIEW,
      useFactory: (em: EntityManager) => new VencimientosProximosView(em),
      inject: [EntityManager],
    },
    {
      provide: VENCIMIENTOS_PENDIENTES_CLIENTE_VIEW,
      useFactory: (em: EntityManager) => new VencimientosPendientesClienteView(em),
      inject: [EntityManager],
    },
    {
      provide: VENCIMIENTOS_POR_ESTADO_VIEW,
      useFactory: (em: EntityManager) => new VencimientosPorEstadoView(em),
      inject: [EntityManager],
    },
    {
      provide: PROXIMOS_VENCIMIENTOS_DETALLE_VIEW,
      useFactory: (em: EntityManager) => new ProximosVencimientosDetalleView(em),
      inject: [EntityManager],
    },
    {
      provide: VENCIMIENTOS_RECIENTES_CLIENTE_VIEW,
      useFactory: (em: EntityManager) => new VencimientosRecientesClienteView(em),
      inject: [EntityManager],
    },
    {
      provide: ACTIVIDAD_RECIENTE_VENCIMIENTOS_VIEW,
      useFactory: (em: EntityManager) => new ActividadRecienteVencimientosView(em),
      inject: [EntityManager],
    },
  ],
  exports: [
    VENCIMIENTO_REPOSITORY,
    CATALOGO_OBLIGACION_REPOSITORY,
    REGLA_VENCIMIENTO_ENTITY_REPOSITORY,
    FERIADO_REPOSITORY,
    ReglaVencimientoService,
    AjusteDiaHabilService,
    VENCIMIENTOS_PROXIMOS_VIEW,
    VENCIMIENTOS_PENDIENTES_CLIENTE_VIEW,
    VENCIMIENTOS_POR_ESTADO_VIEW,
    PROXIMOS_VENCIMIENTOS_DETALLE_VIEW,
    VENCIMIENTOS_RECIENTES_CLIENTE_VIEW,
    ACTIVIDAD_RECIENTE_VENCIMIENTOS_VIEW,
    ProyectarCalendarioMasivoHandler,
  ],
})
export class ObligacionesModule {}
