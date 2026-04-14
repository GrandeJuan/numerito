import { Module } from '@nestjs/common';
import { ObligacionesController } from './infrastructure/controllers/obligaciones.controller';
import { VENCIMIENTO_REPOSITORY } from './domain/repositories/vencimiento.repository';
import type { VencimientoRepository } from './domain/repositories/vencimiento.repository';
import { MikroOrmVencimientoRepository } from './infrastructure/persistence/mikro-orm-vencimiento.repository';
import { CrearVencimientoHandler } from './application/commands/crear-vencimiento.command';
import { PresentarVencimientoHandler } from './application/commands/presentar-vencimiento.command';
import { MarcarVencidoHandler } from './application/commands/marcar-vencido.command';
import type { TenantContext } from '../shared/domain/tenant-context';
import { REQUEST_CONTEXT } from '../shared/infrastructure/services/request-context.service';
import type { EventBus } from '../shared/domain/event-bus';
import { EVENT_BUS } from '../shared/domain/event-bus';

@Module({
  imports: [],
  controllers: [ObligacionesController],
  providers: [
    { provide: VENCIMIENTO_REPOSITORY, useClass: MikroOrmVencimientoRepository },
    {
      provide: CrearVencimientoHandler,
      useFactory: (repo: VencimientoRepository, context: TenantContext) =>
        new CrearVencimientoHandler(repo, context),
      inject: [VENCIMIENTO_REPOSITORY, REQUEST_CONTEXT],
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
  ],
  exports: [VENCIMIENTO_REPOSITORY],
})
export class ObligacionesModule {}
