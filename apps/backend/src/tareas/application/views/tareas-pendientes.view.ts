import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { TareaEntity } from '../../infrastructure/persistence/tarea.schema';

export interface TareasPendientesViewInput {
  estudioId: string;
  responsableId?: string;
}

export interface TareasPendientesDto {
  totalTareasPendientes: number;
}

@Injectable()
export class TareasPendientesView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: TareasPendientesViewInput): Promise<TareasPendientesDto> {
    const filter: Record<string, any> = {
      estudio: input.estudioId,
      estado: { codigo: { $nin: ['COMPLETADA', 'CANCELADA'] } },
    };
    if (input.responsableId) {
      filter.responsable = input.responsableId;
    }

    const totalTareasPendientes = await this.em.count(TareaEntity, filter);

    return { totalTareasPendientes };
  }
}
