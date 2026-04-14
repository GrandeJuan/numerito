import { CrearFacturaHandler, type CrearFacturaCommand } from './crear-factura.command';

describe('CrearFactura Command', () => {
  let handler: CrearFacturaHandler;
  let mockRepo: any;
  let context: { estudioId?: string };

  const validCommand: CrearFacturaCommand = {
    clienteId: 'cliente-1',
    numero: 'FAC-001',
    fechaEmision: '2026-01-01',
    fechaVencimiento: '2026-02-01',
    concepto: 'Honorarios enero',
    lineas: [{ descripcion: 'Servicio contable', cantidad: 1, precioUnitario: 1000, alicuotaIva: 21 }],
  };

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByClienteId: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    context = { estudioId: 'estudio-1' };
    handler = new CrearFacturaHandler(mockRepo, context);
  });

  it('should create a factura and return its id', async () => {
    const result = await handler.execute(validCommand);

    expect(result.id).toBeDefined();
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should use estudioId from tenant context', async () => {
    context.estudioId = 'estudio-99';

    await handler.execute(validCommand);

    const savedFactura = mockRepo.save.mock.calls[0][0];
    expect(savedFactura.estudioId).toBe('estudio-99');
  });

  it('should wire correct facturaId on line items', async () => {
    const result = await handler.execute(validCommand);

    const savedFactura = mockRepo.save.mock.calls[0][0];
    expect(savedFactura.id).toBe(result.id);
    for (const linea of savedFactura.lineas) {
      expect(linea.facturaId).toBe(result.id);
    }
  });

  it('should throw if tenant context is not available', async () => {
    context.estudioId = undefined;

    await expect(handler.execute(validCommand)).rejects.toThrow('Tenant context not available');
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should throw if factura has no lineas', async () => {
    const command = { ...validCommand, lineas: [] };

    await expect(handler.execute(command)).rejects.toThrow();
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should throw if fechaEmision is after fechaVencimiento', async () => {
    const command = {
      ...validCommand,
      fechaEmision: '2026-03-01',
      fechaVencimiento: '2026-01-01',
    };

    await expect(handler.execute(command)).rejects.toThrow();
    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});
