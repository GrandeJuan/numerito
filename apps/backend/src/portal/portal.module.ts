import { Module } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { PortalController } from './infrastructure/controllers/portal.controller';
import { ObtenerPortalStatsHandler } from './application/queries/obtener-portal-stats.query';
import { IamModule } from '../iam/iam.module';

@Module({
  imports: [IamModule],
  controllers: [PortalController],
  providers: [
    {
      provide: ObtenerPortalStatsHandler,
      useFactory: (em: EntityManager) => new ObtenerPortalStatsHandler(em),
      inject: [EntityManager],
    },
  ],
})
export class PortalModule {}
