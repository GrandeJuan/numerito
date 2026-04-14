import { crearFacturaSchema, lineaFacturaSchema } from './factura.schema';

describe('lineaFacturaSchema', () => {
  it('accepts valid line item', () => {
    const result = lineaFacturaSchema.parse({
      descripcion: 'Servicio contable',
      cantidad: 1,
      precioUnitario: 50000,
      alicuotaIva: 21,
    });
    expect(result.precioUnitario).toBe(50000);
  });

  it('rejects cantidad less than 1', () => {
    expect(() =>
      lineaFacturaSchema.parse({
        descripcion: 'Test',
        cantidad: 0,
        precioUnitario: 100,
        alicuotaIva: 21,
      }),
    ).toThrow();
  });
});

describe('crearFacturaSchema', () => {
  const validLine = {
    descripcion: 'Servicio',
    cantidad: 1,
    precioUnitario: 10000,
    alicuotaIva: 21,
  };

  const valid = {
    clienteId: 'client-1',
    numero: 'A-0001-00000001',
    fechaEmision: '2026-01-01',
    fechaVencimiento: '2026-02-01',
    concepto: 'Servicios contables',
    lineas: [validLine],
  };

  it('accepts valid factura input', () => {
    const result = crearFacturaSchema.parse(valid);
    expect(result.lineas).toHaveLength(1);
  });

  it('rejects empty lineas array', () => {
    expect(() => crearFacturaSchema.parse({ ...valid, lineas: [] })).toThrow();
  });

  it('rejects missing clienteId', () => {
    const { clienteId, ...rest } = valid;
    expect(() => crearFacturaSchema.parse(rest)).toThrow();
  });
});
