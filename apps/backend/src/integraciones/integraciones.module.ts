import { Module } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { NOTIFICACION_FISCAL_REPOSITORY } from './domain/repositories/notificacion-fiscal.repository';
import { CREDENCIAL_FISCAL_REPOSITORY } from './domain/repositories/credencial-fiscal.repository';
import { ORGANISMO_FISCAL_REPOSITORY } from './domain/repositories/organismo-fiscal.repository';
import { CONFIGURACION_INGESTA_REPOSITORY } from './domain/repositories/configuracion-ingesta.repository';
import type { ConfiguracionIngestaRepository } from './domain/repositories/configuracion-ingesta.repository';
import { MikroOrmNotificacionFiscalRepository } from './infrastructure/persistence/mikro-orm-notificacion-fiscal.repository';
import { MikroOrmCredencialFiscalRepository } from './infrastructure/persistence/mikro-orm-credencial-fiscal.repository';
import { MikroOrmOrganismoFiscalRepository } from './infrastructure/persistence/mikro-orm-organismo-fiscal.repository';
import { MikroOrmConfiguracionIngestaRepository } from './infrastructure/persistence/mikro-orm-configuracion-ingesta.repository';
import { IngestaAdminController } from './infrastructure/controllers/ingesta-admin.controller';
import { ActualizarConfiguracionIngestaHandler } from './application/commands/actualizar-configuracion-ingesta.command';
import { ConfiguracionIngestaListHandler } from './application/queries/configuracion-ingesta-list.query';

@Module({
  controllers: [IngestaAdminController],
  providers: [
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
  ],
  exports: [
    NOTIFICACION_FISCAL_REPOSITORY,
    CREDENCIAL_FISCAL_REPOSITORY,
    ORGANISMO_FISCAL_REPOSITORY,
    CONFIGURACION_INGESTA_REPOSITORY,
  ],
})
export class IntegracionesModule {}
