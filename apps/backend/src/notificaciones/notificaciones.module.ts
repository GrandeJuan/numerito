import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { IamModule } from '../iam/iam.module';
import { NotificacionesController } from './infrastructure/controllers/notificaciones.controller';
import { NOTIFICACION_REPOSITORY } from './domain/repositories/notificacion.repository';
import { MikroOrmNotificacionRepository } from './infrastructure/persistence/mikro-orm-notificacion.repository';

@Module({
  imports: [IamModule, JwtModule.register({})],
  controllers: [NotificacionesController],
  providers: [
    { provide: NOTIFICACION_REPOSITORY, useClass: MikroOrmNotificacionRepository },
  ],
  exports: [NOTIFICACION_REPOSITORY],
})
export class NotificacionesModule {}
