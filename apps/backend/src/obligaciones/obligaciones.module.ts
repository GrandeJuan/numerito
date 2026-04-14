import { Module } from '@nestjs/common';
import { ObligacionesController } from './infrastructure/controllers/obligaciones.controller';
import { VENCIMIENTO_REPOSITORY } from './domain/repositories/vencimiento.repository';
import type { VencimientoRepository } from './domain/repositories/vencimiento.repository';
import { MikroOrmVencimientoRepository } from './infrastructure/persistence/mikro-orm-vencimiento.repository';
import { CrearVencimientoHandler } from './application/commands/crear-vencimiento.command';
import type { TenantContext } from '../shared/domain/tenant-context';
import { REQUEST_CONTEXT } from '../shared/infrastructure/services/request-context.service';

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
  ],
  exports: [VENCIMIENTO_REPOSITORY],
})
export class ObligacionesModule {}
