import { AsientoContable, LineaAsiento } from './asiento-contable.entity';

describe('AsientoContable Entity', () => {
  it('should create an asiento with balanced lines', () => {
    const asiento = AsientoContable.create({
      libroId: 'libro-1',
      clienteId: 'c1',
      tenantId: 't1',
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

  it('should detect unbalanced asiento', () => {
    const asiento = AsientoContable.create({
      libroId: 'libro-1',
      clienteId: 'c1',
      tenantId: 't1',
      fecha: new Date('2026-03-31'),
      descripcion: 'Asiento desbalanceado',
      lineas: [
        { cuentaId: 'cuenta-1', debe: 10000, haber: 0, descripcion: 'Deudores' },
        { cuentaId: 'cuenta-2', debe: 0, haber: 5000, descripcion: 'Ventas' },
      ],
    });
    expect(asiento.isBalanceado).toBe(false);
  });

  it('should calculate totals', () => {
    const asiento = AsientoContable.create({
      libroId: 'libro-1',
      clienteId: 'c1',
      tenantId: 't1',
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
});
