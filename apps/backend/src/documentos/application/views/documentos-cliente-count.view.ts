import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { DocumentoEntity } from '../../infrastructure/persistence/documento.schema';

export interface DocumentosClienteCountViewInput {
  clienteId: string;
}

export interface DocumentosClienteCountDto {
  totalDocumentos: number;
}

@Injectable()
export class DocumentosClienteCountView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: DocumentosClienteCountViewInput): Promise<DocumentosClienteCountDto> {
    const totalDocumentos = await this.em.count(DocumentoEntity, {
      cliente: input.clienteId,
    });

    return { totalDocumentos };
  }
}
