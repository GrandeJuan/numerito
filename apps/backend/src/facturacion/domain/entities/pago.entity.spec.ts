import { Pago } from './pago.entity';

describe('Pago Entity', () => {
  const validProps = {
    facturaId: 'f1',
    estudioId: 'e1',
    fecha: new Date('2026-04-01'),
    monto: 50000,
    medioPagoId: 1,
    referencia: 'TRF-001',
  };

  it('should create a pago', () => {
    const pago = Pago.create(validProps);
    expect(pago.facturaId).toBe('f1');
    expect(pago.estudioId).toBe('e1');
    expect(pago.fecha).toEqual(new Date('2026-04-01'));
    expect(pago.monto).toBe(50000);
    expect(pago.medioPagoId).toBe(1);
    expect(pago.referencia).toBe('TRF-001');
    expect(pago.id).toBeDefined();
    expect(pago.createdAt).toBeDefined();
  });

  it('should create without referencia', () => {
    const pago = Pago.create({ ...validProps, referencia: undefined });
    expect(pago.referencia).toBeUndefined();
  });

  it('should reject monto <= 0', () => {
    expect(() => Pago.create({ ...validProps, monto: 0 }))
      .toThrow('El monto debe ser mayor a cero');
  });

  it('should reject negative monto', () => {
    expect(() => Pago.create({ ...validProps, monto: -100 }))
      .toThrow('El monto debe ser mayor a cero');
  });

  it('should accept an optional id', () => {
    const pago = Pago.create(validProps, 'custom-id');
    expect(pago.id).toBe('custom-id');
  });
});
