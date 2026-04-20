import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/core';
import { IamModule } from '../iam/iam.module';
import { NotificacionesController } from './infrastructure/controllers/notificaciones.controller';
import { NOTIFICACION_REPOSITORY } from './domain/repositories/notificacion.repository';
import type { NotificacionRepository } from './domain/repositories/notificacion.repository';
import { MikroOrmNotificacionRepository } from './infrastructure/persistence/mikro-orm-notificacion.repository';
import { RESUMEN_MENSUAL_REPOSITORY } from './domain/repositories/resumen-mensual.repository';
import type { ResumenMensualRepository } from './domain/repositories/resumen-mensual.repository';
import { MikroOrmResumenMensualRepository } from './infrastructure/persistence/mikro-orm-resumen-mensual.repository';
import { ResumenMensualListener } from './application/listeners/resumen-mensual.listener';
import { PDF_GENERATOR } from '../shared/domain/ports/pdf-generator.port';
import type { PdfGeneratorPort } from '../shared/domain/ports/pdf-generator.port';
import { SimplePdfGenerator } from '../shared/infrastructure/adapters/simple-pdf-generator';
import { PdfKitCalendarioPdfGenerator } from '../shared/infrastructure/adapters/pdfkit-calendario-pdf-generator';
import { MAIL_SENDER } from '../shared/domain/ports/mail-sender.port';
import type { MailSenderPort } from '../shared/domain/ports/mail-sender.port';
import { ConsoleMailSender } from '../shared/infrastructure/adapters/console-mail-sender';
import { SesMailSender } from '../shared/infrastructure/adapters/ses-mail-sender';

@Module({
  imports: [IamModule, JwtModule.register({})],
  controllers: [NotificacionesController],
  providers: [
    { provide: NOTIFICACION_REPOSITORY, useClass: MikroOrmNotificacionRepository },
    { provide: RESUMEN_MENSUAL_REPOSITORY, useClass: MikroOrmResumenMensualRepository },
    { provide: PDF_GENERATOR, useClass: process.env.PDF_ENGINE === 'pdfkit' ? PdfKitCalendarioPdfGenerator : SimplePdfGenerator },
    { provide: MAIL_SENDER, useClass: process.env.AWS_SES_FROM_EMAIL ? SesMailSender : ConsoleMailSender },

    // ── Listener ──
    {
      provide: ResumenMensualListener,
      useFactory: (
        pdfGenerator: PdfGeneratorPort,
        mailSender: MailSenderPort,
        resumenRepo: ResumenMensualRepository,
        notificacionRepo: NotificacionRepository,
        em: EntityManager,
      ) => new ResumenMensualListener(pdfGenerator, mailSender, resumenRepo, notificacionRepo, em),
      inject: [PDF_GENERATOR, MAIL_SENDER, RESUMEN_MENSUAL_REPOSITORY, NOTIFICACION_REPOSITORY, EntityManager],
    },
  ],
  exports: [NOTIFICACION_REPOSITORY, RESUMEN_MENSUAL_REPOSITORY],
})
export class NotificacionesModule {}
