import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { VencimientoEntity } from '../../infrastructure/persistence/vencimiento.schema';

export interface VencimientosProximosViewInput {
  estudioId: string;
  diasAnticipacion?: number;
}

export interface VencimientosProximosDto {
  totalVencimientosProximos: number;
}

@Injectable()
export class VencimientosProximosView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: VencimientosProximosViewInput): Promise<VencimientosProximosDto> {
    const dias = input.diasAnticipacion ?? 30;
    const now = new Date();
    const hasta = new Date(now);
    hasta.setDate(hasta.getDate() + dias);

    const totalVencimientosProximos = await this.em.count(VencimientoEntity, {
      estudio: input.estudioId,
      fechaVencimiento: { $gte: now, $lte: hasta },
    });

    return { totalVencimientosProximos };
  }
}
