import { Module } from '@nestjs/common';
import { DOCUMENTO_REPOSITORY } from './domain/repositories/documento.repository';
import { MikroOrmDocumentoRepository } from './infrastructure/persistence/mikro-orm-documento.repository';
import { DocumentosController } from './infrastructure/controllers/documentos.controller';

@Module({
  controllers: [DocumentosController],
  providers: [
    { provide: DOCUMENTO_REPOSITORY, useClass: MikroOrmDocumentoRepository },
  ],
  exports: [DOCUMENTO_REPOSITORY],
})
export class DocumentosModule {}
