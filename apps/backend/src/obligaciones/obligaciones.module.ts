import { Module } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { ObligacionesController } from './infrastructure/controllers/obligaciones.controller';
import { CatalogoAdminController } from './infrastructure/controllers/catalogo-admin.controller';
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
import { ReglaVencimientoService } from './domain/services/regla-vencimiento.service';
import { AjusteDiaHabilService } from './domain/services/ajuste-dia-habil.service';
import { FERIADO_REPOSITORY } from './domain/repositories/feriado.repository';
import type { FeriadoRepository } from './domain/repositories/feriado.repository';
import { CrearVencimientoHandler } from './application/commands/crear-vencimiento.command';
import { PresentarVencimientoHandler } from './application/commands/presentar-vencimiento.command';
import { MarcarVencidoHandler } from './application/commands/marcar-vencido.command';
import { CrearCatalogoObligacionHandler } from './application/commands/crear-catalogo-obligacion.command';
import { ActualizarCatalogoObligacionHandler } from './application/commands/actualizar-catalogo-obligacion.command';
import { CrearReglaVencimientoHandler } from './application/commands/crear-regla-vencimiento.command';
import { ActualizarReglaVencimientoHandler } from './application/commands/actualizar-regla-vencimiento.command';
import { ProyectarCalendarioMensualHandler } from './application/commands/proyectar-calendario-mensual.command';
import { VencimientoKpisHandler } from './application/queries/vencimiento-kpis.query';
import { VencimientoListHandler } from './application/queries/vencimiento-list.query';
import { VencimientoCalendarioHandler } from './application/queries/vencimiento-calendario.query';
import { VencimientoByIdHandler } from './application/queries/vencimiento-by-id.query';
import { CatalogoObligacionListHandler } from './application/queries/catalogo-obligacion-list.query';
import { ReglaVencimientoListHandler } from './application/queries/regla-vencimiento-list.query';
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
  imports: [ClientesModule],
  controllers: [ObligacionesController, CatalogoAdminController],
  providers: [
    // ── Repositories ──
    { provide: VENCIMIENTO_REPOSITORY, useClass: MikroOrmVencimientoRepository },
    { provide: CATALOGO_OBLIGACION_REPOSITORY, useClass: MikroOrmCatalogoObligacionRepository },
    { provide: REGLA_VENCIMIENTO_ENTITY_REPOSITORY, useClass: MikroOrmReglaVencimientoRepository },
    { provide: FERIADO_REPOSITORY, useClass: MikroOrmFeriadoRepository },

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
  ],
})
export class ObligacionesModule {}
