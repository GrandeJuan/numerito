import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { ClienteEntity } from '../../infrastructure/persistence/cliente.schema';

export interface ClienteSummaryViewInput {
  estudioId: string;
  responsableId?: string;
}

export interface ClienteSummaryDto {
  totalClientes: number;
}

@Injectable()
export class ClienteSummaryView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: ClienteSummaryViewInput): Promise<ClienteSummaryDto> {
    const filter: Record<string, any> = { estudio: input.estudioId };
    if (input.responsableId) {
      filter.responsable = input.responsableId;
    }

    const totalClientes = await this.em.count(ClienteEntity, filter);

    return { totalClientes };
  }
}
