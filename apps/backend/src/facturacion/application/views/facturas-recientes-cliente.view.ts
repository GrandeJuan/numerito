import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

export interface FacturasRecientesClienteViewInput {
  clienteId: string;
  limite?: number;
}

export interface FacturaRecienteClienteDto {
  id: string;
  numero: string;
  monto: number;
  estado: string;
  fecha: string;
}

@Injectable()
export class FacturasRecientesClienteView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: FacturasRecientesClienteViewInput): Promise<FacturaRecienteClienteDto[]> {
    const limite = input.limite ?? 5;
    const conn = this.em.getConnection();

    const rows = await conn.execute(
      `SELECT f.id, f.numero, f.total as monto, f.estado, f.fecha_emision::text as fecha
       FROM factura f
       WHERE f.cliente_id = ?
       ORDER BY f.fecha_emision DESC
       LIMIT ?`,
      [input.clienteId, limite],
    );

    return rows.map((r: any) => ({
      id: r.id as string,
      numero: r.numero as string,
      monto: Number(r.monto),
      estado: r.estado as string,
      fecha: r.fecha as string,
    }));
  }
}
