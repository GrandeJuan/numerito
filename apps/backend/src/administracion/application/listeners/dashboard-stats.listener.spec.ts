import { DashboardStatsListener } from './dashboard-stats.listener';
import type { DashboardStatsProjection } from '../services/dashboard-stats-projection';
import type { UsuarioRegistradoPayload } from '../../../iam/application/public-events';
import type {
  SubscripcionCreadaPayload,
  SubscripcionRenovadaPayload,
  SubscripcionCanceladaPayload,
  SubscripcionVencidaPayload,
} from '../../../estudio/application/public-events';
import type {
  VencimientoCumplidoPayload,
  VencimientoVencidoPayload,
} from '../../../obligaciones/application/public-events';

describe('DashboardStatsListener', () => {
  let listener: DashboardStatsListener;
  let mockProjection: {
    incrementUsuarios: jest.Mock;
    incrementSubscripciones: jest.Mock;
    incrementRenovaciones: jest.Mock;
    decrementSubscripciones: jest.Mock;
    incrementChurn: jest.Mock;
    incrementVencimientosCumplidos: jest.Mock;
    incrementVencimientosVencidos: jest.Mock;
  };

  beforeEach(() => {
    mockProjection = {
      incrementUsuarios: jest.fn(),
      incrementSubscripciones: jest.fn(),
      incrementRenovaciones: jest.fn(),
      decrementSubscripciones: jest.fn(),
      incrementChurn: jest.fn(),
      incrementVencimientosCumplidos: jest.fn(),
      incrementVencimientosVencidos: jest.fn(),
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

  it('should increment renovaciones on SubscripcionRenovada', () => {
    const event: SubscripcionRenovadaPayload = {
      subscripcionId: 's-1',
      estudioId: 'e-1',
      nuevaFechaFin: new Date(),
      occurredOn: new Date(),
    };
    listener.handleSubscripcionRenovada(event);
    expect(mockProjection.incrementRenovaciones).toHaveBeenCalledTimes(1);
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

  it('should increment vencimientos cumplidos on VencimientoCumplido', () => {
    const event: VencimientoCumplidoPayload = {
      vencimientoId: 'v-1',
      clienteId: 'c-1',
      tipoObligacion: 'IVA',
      periodo: '2026-04',
      occurredOn: new Date(),
    };
    listener.handleVencimientoCumplido(event);
    expect(mockProjection.incrementVencimientosCumplidos).toHaveBeenCalledTimes(1);
  });

  it('should increment vencimientos vencidos on VencimientoVencido', () => {
    const event: VencimientoVencidoPayload = {
      vencimientoId: 'v-1',
      clienteId: 'c-1',
      tipoObligacion: 'IVA',
      periodo: '2026-04',
      occurredOn: new Date(),
    };
    listener.handleVencimientoVencido(event);
    expect(mockProjection.incrementVencimientosVencidos).toHaveBeenCalledTimes(1);
  });
});
