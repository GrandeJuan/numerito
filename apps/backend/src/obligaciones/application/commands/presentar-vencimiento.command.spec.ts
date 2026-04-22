import { PresentarVencimientoHandler } from './presentar-vencimiento.command';
import { Vencimiento } from '../../domain/entities/vencimiento.entity';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

const principal: EstudioPrincipal = { estudioId: 'estudio-1', userId: 'user-1', roles: [] };

const makeVencimiento = () =>
  Vencimiento.reconstitute(
    {
      clienteId: 'cliente-1',
      estudioId: 'estudio-1',
      tipoObligacion: 'IVA',
      periodo: '2026-04',
      fechaVencimiento: new Date('2026-04-20'),
      fechaNominal: null,
      descripcion: 'DDJJ IVA',
      estado: 'PENDIENTE',
      motivo: null,
      fechaProrrogada: null,
      responsableId: null,
    },
    'v-1',
  );

describe('PresentarVencimiento Command', () => {
  let handler: PresentarVencimientoHandler;
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
    handler = new PresentarVencimientoHandler(mockRepo, mockEventBus);
  });

  it('should mark vencimiento as presentado', async () => {
    const v = makeVencimiento();
    mockRepo.findById.mockResolvedValue(v);

    const result = await handler.execute(principal, { vencimientoId: v.id });

    expect(result.estado).toBe('PRESENTADO');
    expect(mockRepo.save).toHaveBeenCalledWith(principal, v);
  });

  it('should publish domain events after save', async () => {
    const v = makeVencimiento();
    mockRepo.findById.mockResolvedValue(v);

    await handler.execute(principal, { vencimientoId: v.id });

    expect(mockEventBus.publishAll).toHaveBeenCalledTimes(1);
    const events = mockEventBus.publishAll.mock.calls[0][0];
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe('obligaciones.vencimiento-cumplido');
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

  it('should throw when vencimiento is already vencido', async () => {
    const v = makeVencimiento();
    v.marcarVencido();
    v.clearDomainEvents();
    mockRepo.findById.mockResolvedValue(v);

    await expect(handler.execute(principal, { vencimientoId: v.id })).rejects.toThrow();
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

  it('should pass principal to repo methods', async () => {
    const v = makeVencimiento();
    mockRepo.findById.mockResolvedValue(v);

    await handler.execute(principal, { vencimientoId: v.id });

    expect(mockRepo.findById).toHaveBeenCalledWith(principal, v.id);
    expect(mockRepo.save).toHaveBeenCalledWith(principal, v);
  });
});
