import { ForbiddenException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { VencimientoEntity } from '../../../obligaciones/infrastructure/persistence/vencimiento.schema';
import { FacturaEntity } from '../../../facturacion/infrastructure/persistence/factura.schema';
import { DocumentoEntity } from '../../../documentos/infrastructure/persistence/documento.schema';

export interface PortalStatsQuery {
  usuarioId: string;
  rol: string;
}

export interface PortalStats {
  clienteNombre: string;
  kpis: {
    vencimientosPendientes: number;
    facturasPendientes: number;
    documentos: number;
  };
  vencimientosRecientes: { id: string; obligacion: string; fecha: string; estado: string }[];
  facturasRecientes: { id: string; numero: string; monto: number; estado: string; fecha: string }[];
  documentosRecientes: { id: string; nombre: string; tipo: string; fecha: string }[];
}

export class ObtenerPortalStatsHandler {
  constructor(private readonly em: EntityManager) {}

  async execute(query: PortalStatsQuery): Promise<PortalStats> {
    if (query.rol !== 'CLIENTE') {
      throw new ForbiddenException('Solo clientes pueden acceder al portal');
    }

    const conn = this.em.getConnection();

    // Find the cliente linked to this user
    const clienteRows = await conn.execute(
      `SELECT c.id, c.razon_social
       FROM cliente c
       JOIN usuario_estudio ue ON ue.estudio_id = c.estudio_id
       WHERE ue.usuario_id = ? AND ue.rol = 'CLIENTE'
       LIMIT 1`,
      [query.usuarioId],
    );

    if (clienteRows.length === 0) {
      throw new ForbiddenException('No se encontro un cliente asociado a este usuario');
    }

    const clienteId = clienteRows[0].id;
    const clienteNombre = clienteRows[0].razon_social;

    // KPIs
    const [vencimientosPendientes, facturasPendientes, documentos] = await Promise.all([
      this.em.count(VencimientoEntity, {
        cliente: clienteId,
        estado: { nombre: 'Pendiente' },
      }),
      this.em.count(FacturaEntity, {
        cliente: clienteId,
        estado: { nombre: { $nin: ['Pagada', 'Anulada'] } },
      }),
      this.em.count(DocumentoEntity, { cliente: clienteId }),
    ]);

    // Recent vencimientos (5)
    const vencimientosRaw = await conn.execute(
      `SELECT v.id, to2.nombre as obligacion, v.fecha_vencimiento::text as fecha, ev.nombre as estado
       FROM vencimiento v
       JOIN tipo_obligacion to2 ON v.tipo_obligacion_id = to2.id
       JOIN estado_vencimiento ev ON v.estado_id = ev.id
       WHERE v.cliente_id = ?
       ORDER BY v.fecha_vencimiento DESC
       LIMIT 5`,
      [clienteId],
    );
    const vencimientosRecientes = vencimientosRaw.map((r: any) => ({
      id: r.id,
      obligacion: r.obligacion,
      fecha: r.fecha,
      estado: r.estado,
    }));

    // Recent facturas (5)
    const facturasRaw = await conn.execute(
      `SELECT f.id, f.numero, f.total as monto, f.estado, f.fecha_emision::text as fecha
       FROM factura f
       WHERE f.cliente_id = ?
       ORDER BY f.fecha_emision DESC
       LIMIT 5`,
      [clienteId],
    );
    const facturasRecientes = facturasRaw.map((r: any) => ({
      id: r.id,
      numero: r.numero,
      monto: Number(r.monto),
      estado: r.estado,
      fecha: r.fecha,
    }));

    // Recent documentos (5)
    const documentosRaw = await conn.execute(
      `SELECT d.id, d.nombre, d.tipo, d.created_at::text as fecha
       FROM documento d
       WHERE d.cliente_id = ?
       ORDER BY d.created_at DESC
       LIMIT 5`,
      [clienteId],
    );
    const documentosRecientes = documentosRaw.map((r: any) => ({
      id: r.id,
      nombre: r.nombre,
      tipo: r.tipo,
      fecha: r.fecha,
    }));

    return {
      clienteNombre,
      kpis: { vencimientosPendientes, facturasPendientes, documentos },
      vencimientosRecientes,
      facturasRecientes,
      documentosRecientes,
    };
  }
}
