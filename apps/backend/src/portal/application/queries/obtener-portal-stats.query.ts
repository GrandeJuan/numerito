import { ForbiddenException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import type { VencimientosPendientesClienteView } from '../../../obligaciones/application/views/vencimientos-pendientes-cliente.view';
import type { FacturasPendientesClienteView } from '../../../facturacion/application/views/facturas-pendientes-cliente.view';
import type { DocumentosClienteCountView } from '../../../documentos/application/views/documentos-cliente-count.view';
import type { VencimientosRecientesClienteView } from '../../../obligaciones/application/views/vencimientos-recientes-cliente.view';
import type { FacturasRecientesClienteView } from '../../../facturacion/application/views/facturas-recientes-cliente.view';
import type { DocumentosRecientesClienteView } from '../../../documentos/application/views/documentos-recientes-cliente.view';

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
  constructor(
    private readonly em: EntityManager,
    private readonly vencimientosPendientesCliente: VencimientosPendientesClienteView,
    private readonly facturasPendientesCliente: FacturasPendientesClienteView,
    private readonly documentosClienteCount: DocumentosClienteCountView,
    private readonly vencimientosRecientesCliente: VencimientosRecientesClienteView,
    private readonly facturasRecientesCliente: FacturasRecientesClienteView,
    private readonly documentosRecientesCliente: DocumentosRecientesClienteView,
  ) {}

  async execute(query: PortalStatsQuery): Promise<PortalStats> {
    if (query.rol !== 'CLIENTE') {
      throw new ForbiddenException('Solo clientes pueden acceder al portal');
    }

    const conn = this.em.getConnection();

    // Find the cliente linked to this user (if any).
    const clienteRows = await conn.execute(
      `SELECT c.id, c.razon_social
       FROM cliente c
       JOIN usuario_estudio ue ON ue.estudio_id = c.estudio_id
       JOIN rol r ON ue.rol_id = r.id
       WHERE ue.usuario_id = ? AND r.codigo = 'CLIENTE'
       LIMIT 1`,
      [query.usuarioId],
    );

    if (clienteRows.length === 0) {
      return {
        clienteNombre: '',
        kpis: { vencimientosPendientes: 0, facturasPendientes: 0, documentos: 0 },
        vencimientosRecientes: [],
        facturasRecientes: [],
        documentosRecientes: [],
      };
    }

    const clienteId = clienteRows[0].id;
    const clienteNombre = clienteRows[0].razon_social;

    // KPIs + recent items — compose views from source contexts
    const [
      vencimientosSummary,
      facturasSummary,
      documentosSummary,
      vencimientosRecientes,
      facturasRecientes,
      documentosRecientes,
    ] = await Promise.all([
      this.vencimientosPendientesCliente.execute({ clienteId }),
      this.facturasPendientesCliente.execute({ clienteId }),
      this.documentosClienteCount.execute({ clienteId }),
      this.vencimientosRecientesCliente.execute({ clienteId }),
      this.facturasRecientesCliente.execute({ clienteId }),
      this.documentosRecientesCliente.execute({ clienteId }),
    ]);

    return {
      clienteNombre,
      kpis: {
        vencimientosPendientes: vencimientosSummary.totalVencimientosPendientes,
        facturasPendientes: facturasSummary.totalFacturasPendientes,
        documentos: documentosSummary.totalDocumentos,
      },
      vencimientosRecientes,
      facturasRecientes,
      documentosRecientes,
    };
  }
}
