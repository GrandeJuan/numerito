import { CrearVencimientoHandler, type CrearVencimientoCommand } from './crear-vencimiento.command';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

const principal: EstudioPrincipal = { estudioId: 'estudio-1', userId: 'user-1', roles: [] };

describe('CrearVencimiento Command', () => {
  let handler: CrearVencimientoHandler;
  let mockRepo: any;

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
    handler = new CrearVencimientoHandler(mockRepo);
  });

  it('should create a vencimiento and return its id', async () => {
    const result = await handler.execute(principal, validCommand);

    expect(result.id).toBeDefined();
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should use estudioId from principal', async () => {
    const customPrincipal: EstudioPrincipal = { estudioId: 'estudio-99', userId: 'user-1', roles: [] };
    await handler.execute(customPrincipal, validCommand);

    const saved = mockRepo.save.mock.calls[0][1];
    expect(saved.estudioId).toBe('estudio-99');
  });

  it('should pass command fields to the domain entity', async () => {
    await handler.execute(principal, validCommand);

    const saved = mockRepo.save.mock.calls[0][1];
    expect(saved.clienteId).toBe('cliente-1');
    expect(saved.tipoObligacion).toBe('IVA');
    expect(saved.periodo).toBe('2026-04');
    expect(saved.descripcion).toBe('DDJJ IVA abril');
    expect(saved.estado).toBe('PENDIENTE');
  });

  it('should throw if fechaVencimiento is in the past', async () => {
    const command = { ...validCommand, fechaVencimiento: '2020-01-01' };

    await expect(handler.execute(principal, command)).rejects.toThrow();
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should convert string fechaVencimiento to Date', async () => {
    await handler.execute(principal, validCommand);

    const saved = mockRepo.save.mock.calls[0][1];
    expect(saved.fechaVencimiento).toBeInstanceOf(Date);
  });

  it('should pass principal to repo.save', async () => {
    await handler.execute(principal, validCommand);

    expect(mockRepo.save).toHaveBeenCalledWith(principal, expect.anything());
  });
});
