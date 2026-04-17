import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { FacturaEntity } from '../../infrastructure/persistence/factura.schema';

export interface FacturasPendientesClienteViewInput {
  clienteId: string;
}

export interface FacturasPendientesClienteDto {
  totalFacturasPendientes: number;
}

@Injectable()
export class FacturasPendientesClienteView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: FacturasPendientesClienteViewInput): Promise<FacturasPendientesClienteDto> {
    const totalFacturasPendientes = await this.em.count(FacturaEntity, {
      cliente: input.clienteId,
      estado: { nombre: { $nin: ['Pagada', 'Anulada'] } },
    });

    return { totalFacturasPendientes };
  }
}
