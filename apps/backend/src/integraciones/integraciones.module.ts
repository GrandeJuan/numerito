import { Module } from '@nestjs/common';
import { NOTIFICACION_FISCAL_REPOSITORY } from './domain/repositories/notificacion-fiscal.repository';
import { CREDENCIAL_FISCAL_REPOSITORY } from './domain/repositories/credencial-fiscal.repository';
import { ORGANISMO_FISCAL_REPOSITORY } from './domain/repositories/organismo-fiscal.repository';
import { MikroOrmNotificacionFiscalRepository } from './infrastructure/persistence/mikro-orm-notificacion-fiscal.repository';
import { MikroOrmCredencialFiscalRepository } from './infrastructure/persistence/mikro-orm-credencial-fiscal.repository';
import { MikroOrmOrganismoFiscalRepository } from './infrastructure/persistence/mikro-orm-organismo-fiscal.repository';

@Module({
  providers: [
    { provide: NOTIFICACION_FISCAL_REPOSITORY, useClass: MikroOrmNotificacionFiscalRepository },
    { provide: CREDENCIAL_FISCAL_REPOSITORY, useClass: MikroOrmCredencialFiscalRepository },
    { provide: ORGANISMO_FISCAL_REPOSITORY, useClass: MikroOrmOrganismoFiscalRepository },
  ],
  exports: [NOTIFICACION_FISCAL_REPOSITORY, CREDENCIAL_FISCAL_REPOSITORY, ORGANISMO_FISCAL_REPOSITORY],
})
export class IntegracionesModule {}
