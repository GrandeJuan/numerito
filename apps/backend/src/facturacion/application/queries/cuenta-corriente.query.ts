export interface FacturaResumen {
  facturaId: string;
  numero: string;
  fechaEmision: Date;
  total: number;
}

export interface PagoResumen {
  pagoId: string;
  facturaId: string;
  fecha: Date;
  monto: number;
  medioPago: string;
}

export interface SaldoResult {
  totalFacturado: number;
  totalPagado: number;
  saldoPendiente: number;
}

export interface CuentaCorrienteResult extends SaldoResult {
  clienteId: string;
  facturas: FacturaResumen[];
  pagos: PagoResumen[];
}

export class CuentaCorrienteQuery {
  static calcularSaldo(facturas: FacturaResumen[], pagos: PagoResumen[]): SaldoResult {
    const totalFacturado = facturas.reduce((sum, f) => sum + f.total, 0);
    const totalPagado = pagos.reduce((sum, p) => sum + p.monto, 0);
    return {
      totalFacturado,
      totalPagado,
      saldoPendiente: totalFacturado - totalPagado,
    };
  }
}
