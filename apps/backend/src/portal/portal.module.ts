import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/core';
import { PortalController } from './infrastructure/controllers/portal.controller';
import { ObtenerPortalStatsHandler } from './application/queries/obtener-portal-stats.query';
import { IamModule } from '../iam/iam.module';

@Module({
  imports: [IamModule, JwtModule.register({})],
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
