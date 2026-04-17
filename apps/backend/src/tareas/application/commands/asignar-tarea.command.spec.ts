import { AsignarTareaHandler } from './asignar-tarea.command';
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

describe('AsignarTarea Command', () => {
  let handler: AsignarTareaHandler;
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
    handler = new AsignarTareaHandler(mockRepo, mockEventBus);
  });

  it('should set responsableId on tarea', async () => {
    const t = makeTarea();
    mockRepo.findById.mockResolvedValue(t);

    const result = await handler.execute(principal, { tareaId: t.id, responsableId: 'user-1' });

    expect(result.responsableId).toBe('user-1');
    expect(mockRepo.save).toHaveBeenCalledWith(principal, t);
  });

  it('should publish collected domain events after save', async () => {
    const t = makeTarea();
    mockRepo.findById.mockResolvedValue(t);

    await handler.execute(principal, { tareaId: t.id, responsableId: 'user-1' });

    expect(mockEventBus.publishAll).toHaveBeenCalledTimes(1);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(mockRepo.save.mock.invocationCallOrder[0]).toBeLessThan(
      mockEventBus.publishAll.mock.invocationCallOrder[0],
    );
  });

  it('should clear domain events after publishing', async () => {
    const t = makeTarea();
    mockRepo.findById.mockResolvedValue(t);

    await handler.execute(principal, { tareaId: t.id, responsableId: 'user-1' });

    expect(t.getDomainEvents()).toHaveLength(0);
  });

  it('should throw when tarea not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(principal, { tareaId: 'bad-id', responsableId: 'user-1' }),
    ).rejects.toThrow('Tarea no encontrad');
    expect(mockRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publishAll).not.toHaveBeenCalled();
  });

  it('should not publish events if save fails', async () => {
    const t = makeTarea();
    mockRepo.findById.mockResolvedValue(t);
    mockRepo.save.mockRejectedValue(new Error('DB error'));

    await expect(
      handler.execute(principal, { tareaId: t.id, responsableId: 'user-1' }),
    ).rejects.toThrow('DB error');
    expect(mockEventBus.publishAll).not.toHaveBeenCalled();
  });
});
