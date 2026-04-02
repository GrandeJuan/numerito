import { Factura } from './factura.entity';
import { ESTADO_FACTURA } from '@numerito/shared';
import { LineaFactura } from './linea-factura.entity';

describe('Factura Entity', () => {
  const createLinea = (cantidad: number, precioUnitario: number, alicuotaIva: number) =>
    LineaFactura.create({
      facturaId: 'placeholder',
      descripcion: 'Servicio',
      cantidad,
      precioUnitario,
      alicuotaIva,
    });

  const createFactura = () => {
    const lineas = [
      createLinea(1, 100000, 21), // subtotal 100000, iva 21000
    ];
    return Factura.create({
      clienteId: 'c1',
      estudioId: 'e1',
      numero: 'FAC-0001',
      fechaEmision: new Date('2026-03-15'),
      fechaVencimiento: new Date('2026-04-15'),
      concepto: 'Honorarios profesionales Marzo 2026',
      lineas,
    });
  };

  it('should create a factura in EMITIDA state', () => {
    const f = createFactura();
    expect(f.estado).toBe(ESTADO_FACTURA.EMITIDA);
    expect(f.subtotal).toBe(100000);
    expect(f.iva).toBe(21000);
    expect(f.total).toBe(121000);
    expect(f.saldoPendiente).toBe(121000);
  });

  it('should calculate from multiple lineas with different alicuotas', () => {
    const lineas = [
      createLinea(2, 50000, 21),   // subtotal 100000, iva 21000
      createLinea(1, 10000, 10.5), // subtotal 10000, iva 1050
      createLinea(3, 5000, 0),     // subtotal 15000, iva 0
    ];
    const f = Factura.create({
      clienteId: 'c1',
      estudioId: 'e1',
      numero: 'FAC-0002',
      fechaEmision: new Date('2026-03-15'),
      fechaVencimiento: new Date('2026-04-15'),
      concepto: 'Varios servicios',
      lineas,
    });
    expect(f.subtotal).toBe(125000);
    expect(f.iva).toBe(22050);
    expect(f.total).toBe(147050);
  });

  it('should track totalPagado and derive estado from pagos', () => {
    const f = createFactura();
    expect(f.totalPagado).toBe(0);

    f.registrarPagoExterno(50000);
    expect(f.totalPagado).toBe(50000);
    expect(f.saldoPendiente).toBe(71000);
    expect(f.estado).toBe(ESTADO_FACTURA.PARCIALMENTE_PAGADA);
  });

  it('should mark as fully paid', () => {
    const f = createFactura();
    f.registrarPagoExterno(121000);
    expect(f.saldoPendiente).toBe(0);
    expect(f.estado).toBe(ESTADO_FACTURA.PAGADA);
  });

  it('should not overpay', () => {
    const f = createFactura();
    expect(() => f.registrarPagoExterno(200000)).toThrow('El pago excede el saldo pendiente');
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
    f.registrarPagoExterno(50000);
    f.marcarVencida();
    expect(f.estado).toBe(ESTADO_FACTURA.VENCIDA);
  });

  it('should not marcarVencida from PAGADA', () => {
    const f = createFactura();
    f.registrarPagoExterno(121000);
    f.marcarVencida();
    expect(f.estado).toBe(ESTADO_FACTURA.PAGADA);
  });

  it('should reject empty lineas', () => {
    expect(() => Factura.create({
      clienteId: 'c1',
      estudioId: 'e1',
      numero: 'FAC-0001',
      fechaEmision: new Date('2026-03-15'),
      fechaVencimiento: new Date('2026-04-15'),
      concepto: 'Test',
      lineas: [],
    })).toThrow('La factura debe tener al menos una linea');
  });

  it('should reject fechaEmision after fechaVencimiento', () => {
    expect(() => Factura.create({
      clienteId: 'c1',
      estudioId: 'e1',
      numero: 'FAC-0001',
      fechaEmision: new Date('2026-05-15'),
      fechaVencimiento: new Date('2026-04-15'),
      concepto: 'Test',
      lineas: [createLinea(1, 100, 21)],
    })).toThrow('La fecha de emision no puede ser posterior a la fecha de vencimiento');
  });

  it('should expose lineas', () => {
    const f = createFactura();
    expect(f.lineas).toHaveLength(1);
    expect(f.lineas[0].subtotal).toBe(100000);
  });

  it('should expose all getters', () => {
    const f = createFactura();
    expect(f.clienteId).toBe('c1');
    expect(f.estudioId).toBe('e1');
    expect(f.numero).toBe('FAC-0001');
    expect(f.fechaEmision).toEqual(new Date('2026-03-15'));
    expect(f.fechaVencimiento).toEqual(new Date('2026-04-15'));
    expect(f.concepto).toBe('Honorarios profesionales Marzo 2026');
    expect(f.estado).toBe(ESTADO_FACTURA.EMITIDA);
    expect(f.totalPagado).toBe(0);
    expect(f.saldoPendiente).toBe(121000);
  });
});
