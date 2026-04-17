import { Module } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { ObligacionesController } from './infrastructure/controllers/obligaciones.controller';
import { VENCIMIENTO_REPOSITORY } from './domain/repositories/vencimiento.repository';
import type { VencimientoRepository } from './domain/repositories/vencimiento.repository';
import { MikroOrmVencimientoRepository } from './infrastructure/persistence/mikro-orm-vencimiento.repository';
import { CrearVencimientoHandler } from './application/commands/crear-vencimiento.command';
import { PresentarVencimientoHandler } from './application/commands/presentar-vencimiento.command';
import { MarcarVencidoHandler } from './application/commands/marcar-vencido.command';
import { VencimientoKpisHandler } from './application/queries/vencimiento-kpis.query';
import { VencimientoListHandler } from './application/queries/vencimiento-list.query';
import { VencimientoCalendarioHandler } from './application/queries/vencimiento-calendario.query';
import { VencimientoByIdHandler } from './application/queries/vencimiento-by-id.query';
import { VencimientosProximosView } from './application/views/vencimientos-proximos.view';
import { VencimientosPendientesClienteView } from './application/views/vencimientos-pendientes-cliente.view';
import { VencimientosPorEstadoView } from './application/views/vencimientos-por-estado.view';
import { ProximosVencimientosDetalleView } from './application/views/proximos-vencimientos-detalle.view';
import {
  VENCIMIENTOS_PROXIMOS_VIEW,
  VENCIMIENTOS_PENDIENTES_CLIENTE_VIEW,
  VENCIMIENTOS_POR_ESTADO_VIEW,
  PROXIMOS_VENCIMIENTOS_DETALLE_VIEW,
} from './application/public-views';
import type { EventBus } from '../shared/domain/event-bus';
import { EVENT_BUS } from '../shared/domain/event-bus';

@Module({
  imports: [],
  controllers: [ObligacionesController],
  providers: [
    { provide: VENCIMIENTO_REPOSITORY, useClass: MikroOrmVencimientoRepository },
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
  ],
  exports: [
    VENCIMIENTO_REPOSITORY,
    VENCIMIENTOS_PROXIMOS_VIEW,
    VENCIMIENTOS_PENDIENTES_CLIENTE_VIEW,
    VENCIMIENTOS_POR_ESTADO_VIEW,
    PROXIMOS_VENCIMIENTOS_DETALLE_VIEW,
  ],
})
export class ObligacionesModule {}
