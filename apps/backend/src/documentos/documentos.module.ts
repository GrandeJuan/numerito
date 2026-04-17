import { Module } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { DOCUMENTO_REPOSITORY } from './domain/repositories/documento.repository';
import { MikroOrmDocumentoRepository } from './infrastructure/persistence/mikro-orm-documento.repository';
import { DocumentosController } from './infrastructure/controllers/documentos.controller';
import { DocumentosClienteCountView } from './application/views/documentos-cliente-count.view';
import { DOCUMENTOS_CLIENTE_COUNT_VIEW } from './application/public-views';

@Module({
  controllers: [DocumentosController],
  providers: [
    { provide: DOCUMENTO_REPOSITORY, useClass: MikroOrmDocumentoRepository },
    {
      provide: DOCUMENTOS_CLIENTE_COUNT_VIEW,
      useFactory: (em: EntityManager) => new DocumentosClienteCountView(em),
      inject: [EntityManager],
    },
  ],
  exports: [DOCUMENTO_REPOSITORY, DOCUMENTOS_CLIENTE_COUNT_VIEW],
})
export class DocumentosModule {}
