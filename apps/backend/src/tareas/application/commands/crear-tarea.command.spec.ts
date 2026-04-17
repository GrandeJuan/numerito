import { CrearTareaHandler, type CrearTareaCommand } from './crear-tarea.command';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

describe('CrearTarea Command', () => {
  let handler: CrearTareaHandler;
  let mockRepo: any;
  let mockEventBus: any;

  const principal: EstudioPrincipal = { estudioId: 'estudio-1', userId: 'user-1', roles: [] };

  const validCommand: CrearTareaCommand = {
    titulo: 'Preparar DDJJ',
    descripcion: 'DDJJ mensual',
    clienteId: 'cliente-1',
    prioridad: 'ALTA',
  };

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByResponsableId: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    };
    handler = new CrearTareaHandler(mockRepo, mockEventBus);
  });

  it('should create a tarea and return the aggregate', async () => {
    const tarea = await handler.execute(principal, validCommand);

    expect(tarea.id).toBeDefined();
    expect(tarea.titulo).toBe('Preparar DDJJ');
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should use estudioId from principal', async () => {
    const otherPrincipal: EstudioPrincipal = { estudioId: 'estudio-99', userId: 'user-1', roles: [] };
    await handler.execute(otherPrincipal, validCommand);

    const saved = mockRepo.save.mock.calls[0][1];
    expect(saved.estudioId).toBe('estudio-99');
  });

  it('should pass command fields to the domain entity', async () => {
    const tarea = await handler.execute(principal, validCommand);

    expect(tarea.descripcion).toBe('DDJJ mensual');
    expect(tarea.clienteId).toBe('cliente-1');
    expect(tarea.prioridad).toBe('ALTA');
    expect(tarea.estado).toBe('PENDIENTE');
  });

  it('should handle tareas without clienteId (optional)', async () => {
    const tarea = await handler.execute(principal, { ...validCommand, clienteId: undefined });

    expect(tarea.clienteId).toBeUndefined();
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should handle tareas without descripcion (optional)', async () => {
    const tarea = await handler.execute(principal, { ...validCommand, descripcion: undefined });

    expect(tarea.descripcion).toBeUndefined();
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should publish collected domain events after save', async () => {
    await handler.execute(principal, validCommand);

    expect(mockEventBus.publishAll).toHaveBeenCalledTimes(1);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(mockRepo.save.mock.invocationCallOrder[0]).toBeLessThan(
      mockEventBus.publishAll.mock.invocationCallOrder[0],
    );
  });

  it('should clear domain events after publishing', async () => {
    const tarea = await handler.execute(principal, validCommand);

    expect(tarea.getDomainEvents()).toHaveLength(0);
  });

  it('should not publish events if save fails', async () => {
    mockRepo.save.mockRejectedValue(new Error('DB error'));

    await expect(handler.execute(principal, validCommand)).rejects.toThrow('DB error');
    expect(mockEventBus.publishAll).not.toHaveBeenCalled();
  });
});
