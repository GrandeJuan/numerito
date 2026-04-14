import { CrearVencimientoHandler, type CrearVencimientoCommand } from './crear-vencimiento.command';

describe('CrearVencimiento Command', () => {
  let handler: CrearVencimientoHandler;
  let mockRepo: any;
  let context: { estudioId?: string };

  const validCommand: CrearVencimientoCommand = {
    clienteId: 'cliente-1',
    tipoObligacion: 'IVA',
    periodo: '2026-04',
    fechaVencimiento: '2026-12-20',
    descripcion: 'DDJJ IVA abril',
  };

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByClienteId: jest.fn(),
      findByPeriodo: jest.fn(),
      findByEstado: jest.fn(),
      findProximosAVencer: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    context = { estudioId: 'estudio-1' };
    handler = new CrearVencimientoHandler(mockRepo, context);
  });

  it('should create a vencimiento and return its id', async () => {
    const result = await handler.execute(validCommand);

    expect(result.id).toBeDefined();
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should use estudioId from tenant context', async () => {
    context.estudioId = 'estudio-99';

    await handler.execute(validCommand);

    const saved = mockRepo.save.mock.calls[0][0];
    expect(saved.estudioId).toBe('estudio-99');
  });

  it('should pass command fields to the domain entity', async () => {
    await handler.execute(validCommand);

    const saved = mockRepo.save.mock.calls[0][0];
    expect(saved.clienteId).toBe('cliente-1');
    expect(saved.tipoObligacion).toBe('IVA');
    expect(saved.periodo).toBe('2026-04');
    expect(saved.descripcion).toBe('DDJJ IVA abril');
    expect(saved.estado).toBe('PENDIENTE');
  });

  it('should throw if tenant context is not available', async () => {
    context.estudioId = undefined;

    await expect(handler.execute(validCommand)).rejects.toThrow('Tenant context not available');
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should throw if fechaVencimiento is in the past', async () => {
    const command = { ...validCommand, fechaVencimiento: '2020-01-01' };

    await expect(handler.execute(command)).rejects.toThrow();
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should convert string fechaVencimiento to Date', async () => {
    await handler.execute(validCommand);

    const saved = mockRepo.save.mock.calls[0][0];
    expect(saved.fechaVencimiento).toBeInstanceOf(Date);
  });
});
