import { RegistrarHorasHandler } from './registrar-horas.command';
import { Tarea } from '../../domain/entities/tarea.entity';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

const principal: EstudioPrincipal = { estudioId: 'estudio-1', userId: 'user-1', roles: [] };

const makeTarea = () =>
  Tarea.create({
    titulo: 'Preparar balance',
    descripcion: 'Balance mensual',
    clienteId: 'cliente-1',
    estudioId: 'estudio-1',
    prioridad: 'MEDIA',
  });

describe('RegistrarHoras Command', () => {
  let handler: RegistrarHorasHandler;
  let mockRepo: any;
  let mockEventBus: any;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    };
    handler = new RegistrarHorasHandler(mockRepo, mockEventBus);
  });

  it('should add horas to tarea', async () => {
    const t = makeTarea();
    mockRepo.findById.mockResolvedValue(t);

    const result = await handler.execute(principal, { tareaId: t.id, horas: 2.5 });

    expect(result.horasRegistradas).toBe(2.5);
    expect(mockRepo.save).toHaveBeenCalledWith(principal, t);
  });

  it('should accumulate horas across multiple executions', async () => {
    const t = makeTarea();
    mockRepo.findById.mockResolvedValue(t);

    await handler.execute(principal, { tareaId: t.id, horas: 1.5 });
    await handler.execute(principal, { tareaId: t.id, horas: 0.5 });

    expect(t.horasRegistradas).toBe(2);
  });

  it('should publish collected domain events after save', async () => {
    const t = makeTarea();
    mockRepo.findById.mockResolvedValue(t);

    await handler.execute(principal, { tareaId: t.id, horas: 1 });

    expect(mockEventBus.publishAll).toHaveBeenCalledTimes(1);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(mockRepo.save.mock.invocationCallOrder[0]).toBeLessThan(
      mockEventBus.publishAll.mock.invocationCallOrder[0],
    );
  });

  it('should clear domain events after publishing', async () => {
    const t = makeTarea();
    mockRepo.findById.mockResolvedValue(t);

    await handler.execute(principal, { tareaId: t.id, horas: 1 });

    expect(t.getDomainEvents()).toHaveLength(0);
  });

  it('should throw when tarea not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(handler.execute(principal, { tareaId: 'bad-id', horas: 1 })).rejects.toThrow(
      'Tarea no encontrad',
    );
    expect(mockRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publishAll).not.toHaveBeenCalled();
  });

  it('should propagate domain exception when horas <= 0', async () => {
    const t = makeTarea();
    mockRepo.findById.mockResolvedValue(t);

    await expect(handler.execute(principal, { tareaId: t.id, horas: 0 })).rejects.toThrow(
      'Las horas deben ser mayor a 0',
    );
    expect(mockRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publishAll).not.toHaveBeenCalled();
  });

  it('should not publish events if save fails', async () => {
    const t = makeTarea();
    mockRepo.findById.mockResolvedValue(t);
    mockRepo.save.mockRejectedValue(new Error('DB error'));

    await expect(handler.execute(principal, { tareaId: t.id, horas: 1 })).rejects.toThrow('DB error');
    expect(mockEventBus.publishAll).not.toHaveBeenCalled();
  });
});
