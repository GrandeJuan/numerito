import { CrearFacturaHandler, type CrearFacturaCommand } from './crear-factura.command';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

const principal: EstudioPrincipal = { estudioId: 'estudio-1', userId: 'user-1', roles: [] };

describe('CrearFactura Command', () => {
  let handler: CrearFacturaHandler;
  let mockRepo: any;

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
    handler = new CrearFacturaHandler(mockRepo);
  });

  it('should create a factura and return its id', async () => {
    const result = await handler.execute(principal, validCommand);

    expect(result.id).toBeDefined();
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(mockRepo.save).toHaveBeenCalledWith(principal, expect.anything());
  });

  it('should use estudioId from principal', async () => {
    const otherPrincipal: EstudioPrincipal = { estudioId: 'estudio-99', userId: 'user-1', roles: [] };
    await handler.execute(otherPrincipal, validCommand);

    const savedFactura = mockRepo.save.mock.calls[0][1];
    expect(savedFactura.estudioId).toBe('estudio-99');
  });

  it('should wire correct facturaId on line items', async () => {
    const result = await handler.execute(principal, validCommand);

    const savedFactura = mockRepo.save.mock.calls[0][1];
    expect(savedFactura.id).toBe(result.id);
    for (const linea of savedFactura.lineas) {
      expect(linea.facturaId).toBe(result.id);
    }
  });

  it('should throw if factura has no lineas', async () => {
    const command = { ...validCommand, lineas: [] };

    await expect(handler.execute(principal, command)).rejects.toThrow();
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should throw if fechaEmision is after fechaVencimiento', async () => {
    const command = {
      ...validCommand,
      fechaEmision: '2026-03-01',
      fechaVencimiento: '2026-01-01',
    };

    await expect(handler.execute(principal, command)).rejects.toThrow();
    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});
