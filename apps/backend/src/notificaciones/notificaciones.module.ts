import { Module } from '@nestjs/common';
import { NotificacionesController } from './infrastructure/controllers/notificaciones.controller';
import { NOTIFICACION_REPOSITORY } from './domain/repositories/notificacion.repository';
import { MikroOrmNotificacionRepository } from './infrastructure/persistence/mikro-orm-notificacion.repository';

@Module({
  controllers: [NotificacionesController],
  providers: [
    { provide: NOTIFICACION_REPOSITORY, useClass: MikroOrmNotificacionRepository },
  ],
  exports: [NOTIFICACION_REPOSITORY],
})
export class NotificacionesModule {}
