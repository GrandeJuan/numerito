import { MarcarVencidoHandler } from './marcar-vencido.command';
import { Vencimiento } from '../../domain/entities/vencimiento.entity';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

const principal: EstudioPrincipal = { estudioId: 'estudio-1', userId: 'user-1', roles: [] };

const makeVencimiento = () =>
  Vencimiento.create({
    clienteId: 'cliente-1',
    estudioId: 'estudio-1',
    tipoObligacion: 'IVA',
    periodo: '2026-04',
    fechaVencimiento: new Date('2026-04-20'),
    descripcion: 'DDJJ IVA',
  });

describe('MarcarVencido Command', () => {
  let handler: MarcarVencidoHandler;
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
    handler = new MarcarVencidoHandler(mockRepo, mockEventBus);
  });

  it('should mark vencimiento as vencido', async () => {
    const v = makeVencimiento();
    mockRepo.findById.mockResolvedValue(v);

    const result = await handler.execute(principal, { vencimientoId: v.id });

    expect(result.estado).toBe('VENCIDO');
    expect(mockRepo.save).toHaveBeenCalledWith(principal, v);
  });

  it('should publish domain events after save', async () => {
    const v = makeVencimiento();
    mockRepo.findById.mockResolvedValue(v);

    await handler.execute(principal, { vencimientoId: v.id });

    expect(mockEventBus.publishAll).toHaveBeenCalledTimes(1);
    const events = mockEventBus.publishAll.mock.calls[0][0];
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe('obligaciones.vencimiento-vencido');
  });

  it('should clear domain events after publishing', async () => {
    const v = makeVencimiento();
    mockRepo.findById.mockResolvedValue(v);

    await handler.execute(principal, { vencimientoId: v.id });

    expect(v.getDomainEvents()).toHaveLength(0);
  });

  it('should throw when vencimiento not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(handler.execute(principal, { vencimientoId: 'bad-id' })).rejects.toThrow(
      'Vencimiento no encontrado',
    );
    expect(mockRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publishAll).not.toHaveBeenCalled();
  });

  it('should not publish events if save fails', async () => {
    const v = makeVencimiento();
    mockRepo.findById.mockResolvedValue(v);
    mockRepo.save.mockRejectedValue(new Error('DB error'));

    await expect(handler.execute(principal, { vencimientoId: v.id })).rejects.toThrow('DB error');
    expect(mockEventBus.publishAll).not.toHaveBeenCalled();
  });
});
