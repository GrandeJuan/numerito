import { DashboardStatsListener } from './dashboard-stats.listener';
import type { DashboardStatsProjection } from '../services/dashboard-stats-projection';
import type { UsuarioRegistradoPayload } from '../../../iam/application/public-events';
import type {
  SubscripcionCreadaPayload,
  SubscripcionCanceladaPayload,
  SubscripcionVencidaPayload,
} from '../../../estudio/application/public-events';

describe('DashboardStatsListener', () => {
  let listener: DashboardStatsListener;
  let mockProjection: {
    incrementUsuarios: jest.Mock;
    incrementSubscripciones: jest.Mock;
    decrementSubscripciones: jest.Mock;
    incrementChurn: jest.Mock;
  };

  beforeEach(() => {
    mockProjection = {
      incrementUsuarios: jest.fn(),
      incrementSubscripciones: jest.fn(),
      decrementSubscripciones: jest.fn(),
      incrementChurn: jest.fn(),
    };
    listener = new DashboardStatsListener(mockProjection as unknown as DashboardStatsProjection);
  });

  it('should increment usuarios on UsuarioRegistrado', () => {
    const event: UsuarioRegistradoPayload = {
      usuarioId: 'u-1',
      email: 'test@test.com',
      occurredOn: new Date(),
    };
    listener.handleUsuarioRegistrado(event);
    expect(mockProjection.incrementUsuarios).toHaveBeenCalledTimes(1);
  });

  it('should increment subscripciones on SubscripcionCreada', () => {
    const event: SubscripcionCreadaPayload = {
      subscripcionId: 's-1',
      estudioId: 'e-1',
      planId: 'PROFESIONAL',
      occurredOn: new Date(),
    };
    listener.handleSubscripcionCreada(event);
    expect(mockProjection.incrementSubscripciones).toHaveBeenCalledTimes(1);
  });

  it('should decrement subscripciones and increment churn on SubscripcionCancelada', () => {
    const event: SubscripcionCanceladaPayload = {
      subscripcionId: 's-1',
      estudioId: 'e-1',
      occurredOn: new Date(),
    };
    listener.handleSubscripcionCancelada(event);
    expect(mockProjection.decrementSubscripciones).toHaveBeenCalledTimes(1);
    expect(mockProjection.incrementChurn).toHaveBeenCalledTimes(1);
  });

  it('should decrement subscripciones on SubscripcionVencida without churn', () => {
    const event: SubscripcionVencidaPayload = {
      subscripcionId: 's-1',
      estudioId: 'e-1',
      occurredOn: new Date(),
    };
    listener.handleSubscripcionVencida(event);
    expect(mockProjection.decrementSubscripciones).toHaveBeenCalledTimes(1);
    expect(mockProjection.incrementChurn).not.toHaveBeenCalled();
  });
});
