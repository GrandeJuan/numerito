import { ESTADO_FACTURA } from '../../domain/entities/factura.entity';
import type { EstadoFactura } from '../../domain/entities/factura.entity';
import type { FacturaRepository } from '../../domain/repositories/factura.repository';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

export interface EstadoCount {
  estado: EstadoFactura;
  cantidad: number;
}

export interface MensualData {
  mes: string;
  facturado: number;
  cobrado: number;
}

export interface FacturacionStats {
  facturado: number;
  cobrado: number;
  cobradoPorcentaje: number;
  saldoPendiente: number;
  facturasVencidas: number;
  porEstado: EstadoCount[];
  mensual: MensualData[];
}

export class FacturacionStatsQuery {
  constructor(private readonly facturaRepo: FacturaRepository) {}

  async execute(principal: EstudioPrincipal): Promise<FacturacionStats> {
    const facturas = await this.facturaRepo.findAll(principal);

    const activas = facturas.filter((f) => f.estado !== ESTADO_FACTURA.ANULADA);

    const facturado = activas.reduce((sum, f) => sum + f.total, 0);
    const cobrado = activas.reduce((sum, f) => sum + f.totalPagado, 0);
    const saldoPendiente = facturado - cobrado;
    const cobradoPorcentaje = facturado > 0 ? Math.round((cobrado / facturado) * 100) : 0;
    const facturasVencidas = facturas.filter((f) => f.estado === ESTADO_FACTURA.VENCIDA).length;

    // Group by estado
    const estadoMap = new Map<EstadoFactura, number>();
    for (const f of facturas) {
      estadoMap.set(f.estado, (estadoMap.get(f.estado) ?? 0) + 1);
    }
    const porEstado: EstadoCount[] = Array.from(estadoMap.entries()).map(([estado, cantidad]) => ({
      estado,
      cantidad,
    }));

    // Group by month
    const mensualMap = new Map<string, { facturado: number; cobrado: number }>();
    for (const f of activas) {
      const mes = `${f.fechaEmision.getFullYear()}-${String(f.fechaEmision.getMonth() + 1).padStart(2, '0')}`;
      const entry = mensualMap.get(mes) ?? { facturado: 0, cobrado: 0 };
      entry.facturado += f.total;
      entry.cobrado += f.totalPagado;
      mensualMap.set(mes, entry);
    }
    const mensual: MensualData[] = Array.from(mensualMap.entries())
      .map(([mes, data]) => ({ mes, ...data }))
      .sort((a, b) => a.mes.localeCompare(b.mes));

    return {
      facturado,
      cobrado,
      cobradoPorcentaje,
      saldoPendiente,
      facturasVencidas,
      porEstado,
      mensual,
    };
  }
}
