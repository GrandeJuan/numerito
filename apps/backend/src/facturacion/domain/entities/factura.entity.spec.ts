import { Factura, ESTADO_FACTURA } from './factura.entity';

describe('Factura Entity', () => {
  const createFactura = () => {
    return Factura.create({
      clienteId: 'c1',
      tenantId: 't1',
      numero: 'FAC-0001',
      fechaEmision: new Date('2026-03-15'),
      fechaVencimiento: new Date('2026-04-15'),
      subtotal: 100000,
      iva: 21000,
      total: 121000,
      concepto: 'Honorarios profesionales Marzo 2026',
    });
  };

  it('should create a factura in EMITIDA state', () => {
    const f = createFactura();
    expect(f.estado).toBe(ESTADO_FACTURA.EMITIDA);
    expect(f.total).toBe(121000);
    expect(f.saldoPendiente).toBe(121000);
  });

  it('should register partial payment', () => {
    const f = createFactura();
    f.registrarPago(50000);
    expect(f.saldoPendiente).toBe(71000);
    expect(f.estado).toBe(ESTADO_FACTURA.PARCIALMENTE_PAGADA);
  });

  it('should mark as fully paid', () => {
    const f = createFactura();
    f.registrarPago(121000);
    expect(f.saldoPendiente).toBe(0);
    expect(f.estado).toBe(ESTADO_FACTURA.PAGADA);
  });

  it('should not overpay', () => {
    const f = createFactura();
    expect(() => f.registrarPago(200000)).toThrow();
  });

  it('should anular', () => {
    const f = createFactura();
    f.anular();
    expect(f.estado).toBe(ESTADO_FACTURA.ANULADA);
  });

  it('should marcarVencida from EMITIDA', () => {
    const f = createFactura();
    f.marcarVencida();
    expect(f.estado).toBe(ESTADO_FACTURA.VENCIDA);
  });

  it('should marcarVencida from PARCIALMENTE_PAGADA', () => {
    const f = createFactura();
    f.registrarPago(50000);
    f.marcarVencida();
    expect(f.estado).toBe(ESTADO_FACTURA.VENCIDA);
  });

  it('should not marcarVencida from PAGADA', () => {
    const f = createFactura();
    f.registrarPago(121000);
    f.marcarVencida();
    expect(f.estado).toBe(ESTADO_FACTURA.PAGADA);
  });

  it('should expose all getters', () => {
    const f = createFactura();
    expect(f.clienteId).toBe('c1');
    expect(f.tenantId).toBe('t1');
    expect(f.numero).toBe('FAC-0001');
    expect(f.fechaEmision).toEqual(new Date('2026-03-15'));
    expect(f.fechaVencimiento).toEqual(new Date('2026-04-15'));
    expect(f.subtotal).toBe(100000);
    expect(f.iva).toBe(21000);
    expect(f.total).toBe(121000);
    expect(f.concepto).toBe('Honorarios profesionales Marzo 2026');
    expect(f.estado).toBe(ESTADO_FACTURA.EMITIDA);
    expect(f.totalPagado).toBe(0);
    expect(f.saldoPendiente).toBe(121000);
  });
});
