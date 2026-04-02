import { LineaFactura } from './linea-factura.entity';

describe('LineaFactura Entity', () => {
  it('should create a linea and calculate subtotal', () => {
    const linea = LineaFactura.create({
      facturaId: 'f1',
      descripcion: 'Honorarios Marzo',
      cantidad: 2,
      precioUnitario: 50000,
      alicuotaIva: 21,
    });

    expect(linea.facturaId).toBe('f1');
    expect(linea.descripcion).toBe('Honorarios Marzo');
    expect(linea.cantidad).toBe(2);
    expect(linea.precioUnitario).toBe(50000);
    expect(linea.alicuotaIva).toBe(21);
    expect(linea.subtotal).toBe(100000);
    expect(linea.id).toBeDefined();
  });

  it('should calculate subtotal with decimals', () => {
    const linea = LineaFactura.create({
      facturaId: 'f1',
      descripcion: 'Servicio',
      cantidad: 3,
      precioUnitario: 1500.50,
      alicuotaIva: 10.5,
    });
    expect(linea.subtotal).toBe(4501.5);
  });

  it('should reject cantidad <= 0', () => {
    expect(() => LineaFactura.create({
      facturaId: 'f1',
      descripcion: 'Test',
      cantidad: 0,
      precioUnitario: 100,
      alicuotaIva: 21,
    })).toThrow('La cantidad debe ser mayor a cero');
  });

  it('should reject precioUnitario < 0', () => {
    expect(() => LineaFactura.create({
      facturaId: 'f1',
      descripcion: 'Test',
      cantidad: 1,
      precioUnitario: -1,
      alicuotaIva: 21,
    })).toThrow('El precio unitario no puede ser negativo');
  });

  it('should reject alicuotaIva < 0', () => {
    expect(() => LineaFactura.create({
      facturaId: 'f1',
      descripcion: 'Test',
      cantidad: 1,
      precioUnitario: 100,
      alicuotaIva: -1,
    })).toThrow('La alicuota de IVA no puede ser negativa');
  });

  it('should allow alicuotaIva = 0 (exento)', () => {
    const linea = LineaFactura.create({
      facturaId: 'f1',
      descripcion: 'Exento',
      cantidad: 1,
      precioUnitario: 1000,
      alicuotaIva: 0,
    });
    expect(linea.alicuotaIva).toBe(0);
    expect(linea.subtotal).toBe(1000);
  });

  it('should accept an optional id', () => {
    const linea = LineaFactura.create({
      facturaId: 'f1',
      descripcion: 'Test',
      cantidad: 1,
      precioUnitario: 100,
      alicuotaIva: 21,
    }, 'custom-id');
    expect(linea.id).toBe('custom-id');
  });
});
