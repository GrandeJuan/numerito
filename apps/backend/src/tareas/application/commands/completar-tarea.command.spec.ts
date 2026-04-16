import { CompletarTareaHandler } from './completar-tarea.command';
import { Tarea } from '../../domain/entities/tarea.entity';

const makeTarea = () =>
  Tarea.create({
    titulo: 'Preparar balance',
    descripcion: 'Balance mensual',
    clienteId: 'cliente-1',
    estudioId: 'estudio-1',
    prioridad: 'MEDIA',
  });

describe('CompletarTarea Command', () => {
  let handler: CompletarTareaHandler;
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
    handler = new CompletarTareaHandler(mockRepo, mockEventBus);
  });

  it('should mark tarea as COMPLETADO when in EN_PROGRESO', async () => {
    const t = makeTarea();
    t.iniciar();
    mockRepo.findById.mockResolvedValue(t);

    const result = await handler.execute({ tareaId: t.id });

    expect(result.estado).toBe('COMPLETADO');
    expect(mockRepo.save).toHaveBeenCalledWith(t);
  });

  it('should publish collected domain events after save', async () => {
    const t = makeTarea();
    t.iniciar();
    mockRepo.findById.mockResolvedValue(t);

    await handler.execute({ tareaId: t.id });

    expect(mockEventBus.publishAll).toHaveBeenCalledTimes(1);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(mockRepo.save.mock.invocationCallOrder[0]).toBeLessThan(
      mockEventBus.publishAll.mock.invocationCallOrder[0],
    );
  });

  it('should clear domain events after publishing', async () => {
    const t = makeTarea();
    t.iniciar();
    mockRepo.findById.mockResolvedValue(t);

    await handler.execute({ tareaId: t.id });

    expect(t.getDomainEvents()).toHaveLength(0);
  });

  it('should throw when tarea not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(handler.execute({ tareaId: 'bad-id' })).rejects.toThrow('Tarea no encontrad');
    expect(mockRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publishAll).not.toHaveBeenCalled();
  });

  it('should propagate domain exception when tarea is not in progress', async () => {
    const t = makeTarea();
    mockRepo.findById.mockResolvedValue(t);

    await expect(handler.execute({ tareaId: t.id })).rejects.toThrow(
      'Solo se puede completar una tarea en progreso',
    );
    expect(mockRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publishAll).not.toHaveBeenCalled();
  });

  it('should not publish events if save fails', async () => {
    const t = makeTarea();
    t.iniciar();
    mockRepo.findById.mockResolvedValue(t);
    mockRepo.save.mockRejectedValue(new Error('DB error'));

    await expect(handler.execute({ tareaId: t.id })).rejects.toThrow('DB error');
    expect(mockEventBus.publishAll).not.toHaveBeenCalled();
  });
});
