import { CambiarPlanSubscripcionHandler } from './cambiar-plan-subscripcion.command';
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

describe('CambiarPlanSubscripcion Command', () => {
  let handler: CambiarPlanSubscripcionHandler;
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
    handler = new CambiarPlanSubscripcionHandler(mockRepo, mockEventBus);
  });

  it('should change the plan of the active subscription', async () => {
    const sub = makeSubscripcion();
    mockRepo.findActiva.mockResolvedValue(sub);

    const result = await handler.execute({ planId: 'plan-2' });

    expect(result.planId).toBe('plan-2');
    expect(mockRepo.save).toHaveBeenCalledWith(sub);
  });

  it('should publish domain events after save', async () => {
    const sub = makeSubscripcion();
    mockRepo.findActiva.mockResolvedValue(sub);

    await handler.execute({ planId: 'plan-2' });

    expect(mockEventBus.publishAll).toHaveBeenCalledTimes(1);
  });

  it('should clear domain events after publishing', async () => {
    const sub = makeSubscripcion();
    mockRepo.findActiva.mockResolvedValue(sub);

    await handler.execute({ planId: 'plan-2' });

    expect(sub.getDomainEvents()).toHaveLength(0);
  });

  it('should throw when no active subscription found', async () => {
    mockRepo.findActiva.mockResolvedValue(null);

    await expect(handler.execute({ planId: 'plan-2' })).rejects.toThrow(
      'Subscripcion no encontrad',
    );
    expect(mockRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publishAll).not.toHaveBeenCalled();
  });

  it('should not publish events if save fails', async () => {
    const sub = makeSubscripcion();
    mockRepo.findActiva.mockResolvedValue(sub);
    mockRepo.save.mockRejectedValue(new Error('DB error'));

    await expect(handler.execute({ planId: 'plan-2' })).rejects.toThrow('DB error');
    expect(mockEventBus.publishAll).not.toHaveBeenCalled();
  });

  it('should throw when subscription is cancelled', async () => {
    const sub = makeSubscripcion();
    sub.cancelar();
    sub.clearDomainEvents();
    mockRepo.findActiva.mockResolvedValue(sub);

    await expect(handler.execute({ planId: 'plan-2' })).rejects.toThrow();
    expect(mockRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publishAll).not.toHaveBeenCalled();
  });
});
