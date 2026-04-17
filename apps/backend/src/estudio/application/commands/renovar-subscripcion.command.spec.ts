import { RenovarSubscripcionHandler } from './renovar-subscripcion.command';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import {
  Subscripcion,
  EstadoSubscripcion,
  CicloFacturacion,
} from '../../domain/entities/subscripcion.entity';

const principal: EstudioPrincipal = {
  estudioId: 'estudio-1',
  userId: 'user-1',
  roles: ['SOCIO'],
};

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

describe('RenovarSubscripcion Command', () => {
  let handler: RenovarSubscripcionHandler;
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
    handler = new RenovarSubscripcionHandler(mockRepo, mockEventBus);
  });

  it('should renew the subscription with a new end date', async () => {
    const sub = makeSubscripcion();
    mockRepo.findActiva.mockResolvedValue(sub);

    const result = await handler.execute(principal, { nuevaFechaFin: '2027-12-31' });

    expect(result.fechaFin).toEqual(new Date('2027-12-31'));
    expect(result.estado).toBe(EstadoSubscripcion.ACTIVA);
    expect(mockRepo.findActiva).toHaveBeenCalledWith(principal);
    expect(mockRepo.save).toHaveBeenCalledWith(principal, sub);
  });

  it('should publish SubscripcionRenovada event after save', async () => {
    const sub = makeSubscripcion();
    mockRepo.findActiva.mockResolvedValue(sub);

    await handler.execute(principal, { nuevaFechaFin: '2027-12-31' });

    expect(mockEventBus.publishAll).toHaveBeenCalledTimes(1);
    const events = mockEventBus.publishAll.mock.calls[0][0];
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe('estudio.subscripcion-renovada');
  });

  it('should clear domain events after publishing', async () => {
    const sub = makeSubscripcion();
    mockRepo.findActiva.mockResolvedValue(sub);

    await handler.execute(principal, { nuevaFechaFin: '2027-12-31' });

    expect(sub.getDomainEvents()).toHaveLength(0);
  });

  it('should throw when no active subscription found', async () => {
    mockRepo.findActiva.mockResolvedValue(null);

    await expect(handler.execute(principal, { nuevaFechaFin: '2027-12-31' })).rejects.toThrow(
      'Subscripcion no encontrad',
    );
    expect(mockRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publishAll).not.toHaveBeenCalled();
  });

  it('should not publish events if save fails', async () => {
    const sub = makeSubscripcion();
    mockRepo.findActiva.mockResolvedValue(sub);
    mockRepo.save.mockRejectedValue(new Error('DB error'));

    await expect(handler.execute(principal, { nuevaFechaFin: '2027-12-31' })).rejects.toThrow('DB error');
    expect(mockEventBus.publishAll).not.toHaveBeenCalled();
  });

  it('should throw when subscription is cancelled', async () => {
    const sub = makeSubscripcion();
    sub.cancelar();
    sub.clearDomainEvents();
    mockRepo.findActiva.mockResolvedValue(sub);

    await expect(handler.execute(principal, { nuevaFechaFin: '2027-12-31' })).rejects.toThrow();
    expect(mockRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publishAll).not.toHaveBeenCalled();
  });
});
