import { AgregarComentarioHandler } from './agregar-comentario.command';
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

describe('AgregarComentario Command', () => {
  let handler: AgregarComentarioHandler;
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
    handler = new AgregarComentarioHandler(mockRepo, mockEventBus);
  });

  it('should append comentario to tarea', async () => {
    const t = makeTarea();
    mockRepo.findById.mockResolvedValue(t);

    const result = await handler.execute(principal, {
      tareaId: t.id,
      autorId: 'user-1',
      texto: 'Avanzando bien',
    });

    expect(result.comentarios).toHaveLength(1);
    expect(result.comentarios[0].usuarioId).toBe('user-1');
    expect(result.comentarios[0].texto).toBe('Avanzando bien');
    expect(mockRepo.save).toHaveBeenCalledWith(principal, t);
  });

  it('should accumulate comentarios across multiple executions', async () => {
    const t = makeTarea();
    mockRepo.findById.mockResolvedValue(t);

    await handler.execute(principal, { tareaId: t.id, autorId: 'user-1', texto: 'primero' });
    await handler.execute(principal, { tareaId: t.id, autorId: 'user-2', texto: 'segundo' });

    expect(t.comentarios).toHaveLength(2);
    expect(t.comentarios[0].texto).toBe('primero');
    expect(t.comentarios[1].texto).toBe('segundo');
  });

  it('should publish collected domain events after save', async () => {
    const t = makeTarea();
    mockRepo.findById.mockResolvedValue(t);

    await handler.execute(principal, { tareaId: t.id, autorId: 'user-1', texto: 'hola' });

    expect(mockEventBus.publishAll).toHaveBeenCalledTimes(1);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(mockRepo.save.mock.invocationCallOrder[0]).toBeLessThan(
      mockEventBus.publishAll.mock.invocationCallOrder[0],
    );
  });

  it('should clear domain events after publishing', async () => {
    const t = makeTarea();
    mockRepo.findById.mockResolvedValue(t);

    await handler.execute(principal, { tareaId: t.id, autorId: 'user-1', texto: 'hola' });

    expect(t.getDomainEvents()).toHaveLength(0);
  });

  it('should throw when tarea not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(principal, { tareaId: 'bad-id', autorId: 'user-1', texto: 'hola' }),
    ).rejects.toThrow('Tarea no encontrad');
    expect(mockRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publishAll).not.toHaveBeenCalled();
  });

  it('should not publish events if save fails', async () => {
    const t = makeTarea();
    mockRepo.findById.mockResolvedValue(t);
    mockRepo.save.mockRejectedValue(new Error('DB error'));

    await expect(
      handler.execute(principal, { tareaId: t.id, autorId: 'user-1', texto: 'hola' }),
    ).rejects.toThrow('DB error');
    expect(mockEventBus.publishAll).not.toHaveBeenCalled();
  });
});
