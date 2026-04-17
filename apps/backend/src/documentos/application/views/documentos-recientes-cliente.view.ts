import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

export interface DocumentosRecientesClienteViewInput {
  clienteId: string;
  limite?: number;
}

export interface DocumentoRecienteClienteDto {
  id: string;
  nombre: string;
  tipo: string;
  fecha: string;
}

@Injectable()
export class DocumentosRecientesClienteView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: DocumentosRecientesClienteViewInput): Promise<DocumentoRecienteClienteDto[]> {
    const limite = input.limite ?? 5;
    const conn = this.em.getConnection();

    const rows = await conn.execute(
      `SELECT d.id, d.nombre, d.tipo, d.created_at::text as fecha
       FROM documento d
       WHERE d.cliente_id = ?
       ORDER BY d.created_at DESC
       LIMIT ?`,
      [input.clienteId, limite],
    );

    return rows.map((r: any) => ({
      id: r.id as string,
      nombre: r.nombre as string,
      tipo: r.tipo as string,
      fecha: r.fecha as string,
    }));
  }
}
