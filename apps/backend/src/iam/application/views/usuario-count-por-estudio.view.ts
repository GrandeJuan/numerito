import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { UsuarioEstudioEntity } from '../../infrastructure/persistence/usuario-estudio.schema';

export interface UsuarioCountPorEstudioViewInput {
  estudioId: string;
}

export interface UsuarioCountPorEstudioDto {
  count: number;
}

@Injectable()
export class UsuarioCountPorEstudioView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: UsuarioCountPorEstudioViewInput): Promise<UsuarioCountPorEstudioDto> {
    const count = await this.em.count(
      UsuarioEstudioEntity,
      { estudio: input.estudioId, isActive: true } as any,
    );
    return { count };
  }
}
