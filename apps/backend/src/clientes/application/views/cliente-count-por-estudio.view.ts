import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { ClienteEntity } from '../../infrastructure/persistence/cliente.schema';

export interface ClienteCountPorEstudioViewInput {
  estudioId: string;
}

export interface ClienteCountPorEstudioDto {
  count: number;
}

@Injectable()
export class ClienteCountPorEstudioView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: ClienteCountPorEstudioViewInput): Promise<ClienteCountPorEstudioDto> {
    const count = await this.em.count(
      ClienteEntity,
      { estudio: input.estudioId, isActive: true } as any,
    );
    return { count };
  }
}
