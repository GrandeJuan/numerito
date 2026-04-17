import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { VencimientoEntity } from '../../infrastructure/persistence/vencimiento.schema';

export interface VencimientosPendientesClienteViewInput {
  clienteId: string;
}

export interface VencimientosPendientesClienteDto {
  totalVencimientosPendientes: number;
}

@Injectable()
export class VencimientosPendientesClienteView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: VencimientosPendientesClienteViewInput): Promise<VencimientosPendientesClienteDto> {
    const totalVencimientosPendientes = await this.em.count(VencimientoEntity, {
      cliente: input.clienteId,
      estado: { nombre: 'Pendiente' },
    });

    return { totalVencimientosPendientes };
  }
}
