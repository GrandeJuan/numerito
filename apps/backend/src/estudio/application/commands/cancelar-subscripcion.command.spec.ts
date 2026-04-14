import { CancelarSubscripcionHandler } from './cancelar-subscripcion.command';
import {
  Subscripcion,
  EstadoSubscripcion,
  CicloFacturacion,
} from '../../domain/entities/subscripcion.entity';

const makeSubscripcion = () => {
  const sub = Subscripcion.create({
    estudioId: 'estudio-1',
    planId: 'plan-1',
    fechaInicio: new Date('2026-01-01'),
    fechaFin: new Date('2026-12-31'),
    estado: EstadoSubscripcion.ACTIVA,
    cicloFacturacion: CicloFacturacion.MENSUAL,
    autoRenovacion: true,
  });
  sub.clearDomainEvents();
  return sub;
};

describe('CancelarSubscripcion Command', () => {
  let handler: CancelarSubscripcionHandler;
  let mockRepo: any;
  let mockEventBus: any;

  beforeEach(() => {
    mockRepo = {
      findActiva: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    };
    handler = new CancelarSubscripcionHandler(mockRepo, mockEventBus);
  });

  it('should cancel the active subscription', async () => {
    const sub = makeSubscripcion();
    mockRepo.findActiva.mockResolvedValue(sub);

    const result = await handler.execute();

    expect(result.estado).toBe(EstadoSubscripcion.CANCELADA);
    expect(mockRepo.save).toHaveBeenCalledWith(sub);
  });

  it('should publish SubscripcionCancelada event after save', async () => {
    const sub = makeSubscripcion();
    mockRepo.findActiva.mockResolvedValue(sub);

    await handler.execute();

    expect(mockEventBus.publishAll).toHaveBeenCalledTimes(1);
    const events = mockEventBus.publishAll.mock.calls[0][0];
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe('estudio.subscripcion-cancelada');
  });

  it('should clear domain events after publishing', async () => {
    const sub = makeSubscripcion();
    mockRepo.findActiva.mockResolvedValue(sub);

    await handler.execute();

    expect(sub.getDomainEvents()).toHaveLength(0);
  });

  it('should throw when no active subscription found', async () => {
    mockRepo.findActiva.mockResolvedValue(null);

    await expect(handler.execute()).rejects.toThrow('Subscripcion no encontrad');
    expect(mockRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publishAll).not.toHaveBeenCalled();
  });

  it('should not publish events if save fails', async () => {
    const sub = makeSubscripcion();
    mockRepo.findActiva.mockResolvedValue(sub);
    mockRepo.save.mockRejectedValue(new Error('DB error'));

    await expect(handler.execute()).rejects.toThrow('DB error');
    expect(mockEventBus.publishAll).not.toHaveBeenCalled();
  });

  it('should throw when subscription is already cancelled', async () => {
    const sub = makeSubscripcion();
    sub.cancelar();
    sub.clearDomainEvents();
    mockRepo.findActiva.mockResolvedValue(sub);

    await expect(handler.execute()).rejects.toThrow();
    expect(mockRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publishAll).not.toHaveBeenCalled();
  });
});
