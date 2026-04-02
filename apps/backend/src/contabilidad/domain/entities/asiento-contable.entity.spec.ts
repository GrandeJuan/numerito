import { AsientoContable } from './asiento-contable.entity';

describe('AsientoContable Entity', () => {
  it('should create an asiento with balanced lines', () => {
    const asiento = AsientoContable.create({
      libroId: 'libro-1',
      clienteId: 'c1',
      estudioId: 'e1',
      fecha: new Date('2026-03-31'),
      descripcion: 'Venta de servicios',
      lineas: [
        { cuentaId: 'cuenta-1', debe: 10000, haber: 0, descripcion: 'Deudores por ventas' },
        { cuentaId: 'cuenta-2', debe: 0, haber: 10000, descripcion: 'Ventas' },
      ],
    });
    expect(asiento.id).toBeDefined();
    expect(asiento.isBalanceado).toBe(true);
    expect(asiento.lineas).toHaveLength(2);
  });

  it('should reject unbalanced asiento on create', () => {
    expect(() => AsientoContable.create({
      libroId: 'libro-1',
      clienteId: 'c1',
      estudioId: 'e1',
      fecha: new Date('2026-03-31'),
      descripcion: 'Asiento desbalanceado',
      lineas: [
        { cuentaId: 'cuenta-1', debe: 10000, haber: 0, descripcion: 'Deudores' },
        { cuentaId: 'cuenta-2', debe: 0, haber: 5000, descripcion: 'Ventas' },
      ],
    })).toThrow('El asiento contable debe estar balanceado');
  });

  it('should reject empty lineas', () => {
    expect(() => AsientoContable.create({
      libroId: 'libro-1',
      clienteId: 'c1',
      estudioId: 'e1',
      fecha: new Date('2026-03-31'),
      descripcion: 'Sin lineas',
      lineas: [],
    })).toThrow('El asiento debe tener al menos una linea');
  });

  it('should calculate totals', () => {
    const asiento = AsientoContable.create({
      libroId: 'libro-1',
      clienteId: 'c1',
      estudioId: 'e1',
      fecha: new Date('2026-03-31'),
      descripcion: 'Test',
      lineas: [
        { cuentaId: 'c1', debe: 5000, haber: 0, descripcion: 'D1' },
        { cuentaId: 'c2', debe: 3000, haber: 0, descripcion: 'D2' },
        { cuentaId: 'c3', debe: 0, haber: 8000, descripcion: 'H1' },
      ],
    });
    expect(asiento.totalDebe).toBe(8000);
    expect(asiento.totalHaber).toBe(8000);
  });

  it('should expose all getters', () => {
    const fecha = new Date('2026-03-31');
    const asiento = AsientoContable.create({
      libroId: 'libro-1',
      clienteId: 'c1',
      estudioId: 'e1',
      fecha,
      descripcion: 'Venta servicios',
      lineas: [
        { cuentaId: 'cuenta-1', debe: 1000, haber: 0, descripcion: 'D' },
        { cuentaId: 'cuenta-2', debe: 0, haber: 1000, descripcion: 'H' },
      ],
    });
    expect(asiento.libroId).toBe('libro-1');
    expect(asiento.clienteId).toBe('c1');
    expect(asiento.estudioId).toBe('e1');
    expect(asiento.fecha).toBe(fecha);
    expect(asiento.descripcion).toBe('Venta servicios');
    expect(asiento.lineas).toHaveLength(2);
    // lineas returns a copy
    expect(asiento.lineas).not.toBe(asiento.lineas);
  });
});
