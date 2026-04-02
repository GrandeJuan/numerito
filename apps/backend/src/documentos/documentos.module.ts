import { Module } from '@nestjs/common';
import { DOCUMENTO_REPOSITORY } from './domain/repositories/documento.repository';
import { MikroOrmDocumentoRepository } from './infrastructure/persistence/mikro-orm-documento.repository';

@Module({
  providers: [
    { provide: DOCUMENTO_REPOSITORY, useClass: MikroOrmDocumentoRepository },
  ],
  exports: [DOCUMENTO_REPOSITORY],
})
export class DocumentosModule {}
