import { CuentaCorrienteQuery, CuentaCorrienteResult, FacturaResumen, PagoResumen } from './cuenta-corriente.query';

describe('CuentaCorrienteQuery', () => {
  it('should calculate saldo total from facturas and pagos', () => {
    const facturas: FacturaResumen[] = [
      { facturaId: 'f1', numero: 'FAC-001', fechaEmision: new Date('2026-03-01'), total: 121000 },
      { facturaId: 'f2', numero: 'FAC-002', fechaEmision: new Date('2026-03-15'), total: 60500 },
    ];
    const pagos: PagoResumen[] = [
      { pagoId: 'p1', facturaId: 'f1', fecha: new Date('2026-03-10'), monto: 50000, medioPago: 'TRANSFERENCIA' },
      { pagoId: 'p2', facturaId: 'f1', fecha: new Date('2026-03-20'), monto: 71000, medioPago: 'EFECTIVO' },
    ];

    const result = CuentaCorrienteQuery.calcularSaldo(facturas, pagos);

    expect(result.totalFacturado).toBe(181500);
    expect(result.totalPagado).toBe(121000);
    expect(result.saldoPendiente).toBe(60500);
  });

  it('should return zero saldo when fully paid', () => {
    const facturas: FacturaResumen[] = [
      { facturaId: 'f1', numero: 'FAC-001', fechaEmision: new Date('2026-03-01'), total: 100000 },
    ];
    const pagos: PagoResumen[] = [
      { pagoId: 'p1', facturaId: 'f1', fecha: new Date('2026-03-10'), monto: 100000, medioPago: 'CHEQUE' },
    ];

    const result = CuentaCorrienteQuery.calcularSaldo(facturas, pagos);
    expect(result.saldoPendiente).toBe(0);
  });

  it('should handle empty facturas and pagos', () => {
    const result = CuentaCorrienteQuery.calcularSaldo([], []);
    expect(result.totalFacturado).toBe(0);
    expect(result.totalPagado).toBe(0);
    expect(result.saldoPendiente).toBe(0);
  });

  it('should build full CuentaCorrienteResult', () => {
    const facturas: FacturaResumen[] = [
      { facturaId: 'f1', numero: 'FAC-001', fechaEmision: new Date('2026-03-01'), total: 50000 },
    ];
    const pagos: PagoResumen[] = [];

    const result: CuentaCorrienteResult = {
      clienteId: 'c1',
      facturas,
      pagos,
      ...CuentaCorrienteQuery.calcularSaldo(facturas, pagos),
    };

    expect(result.clienteId).toBe('c1');
    expect(result.facturas).toHaveLength(1);
    expect(result.pagos).toHaveLength(0);
    expect(result.saldoPendiente).toBe(50000);
  });
});
