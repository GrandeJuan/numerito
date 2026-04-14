import { DashboardStatsListener } from './dashboard-stats.listener';
import type { DashboardStatsProjection } from '../services/dashboard-stats-projection';
import type { MaterializeDashboardSnapshotService } from '../services/materialize-dashboard-snapshot.service';
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
  let mockMaterializer: {
    markStale: jest.Mock;
    refresh: jest.Mock;
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
    mockMaterializer = {
      markStale: jest.fn().mockResolvedValue(undefined),
      refresh: jest.fn().mockResolvedValue(true),
    };
    listener = new DashboardStatsListener(
      mockProjection as unknown as DashboardStatsProjection,
      mockMaterializer as unknown as MaterializeDashboardSnapshotService,
    );
  });

  it('should increment usuarios on UsuarioRegistrado and invalidate snapshot', () => {
    const event: UsuarioRegistradoPayload = {
      usuarioId: 'u-1',
      email: 'test@test.com',
      occurredOn: new Date(),
    };
    listener.handleUsuarioRegistrado(event);
    expect(mockProjection.incrementUsuarios).toHaveBeenCalledTimes(1);
    expect(mockMaterializer.markStale).toHaveBeenCalledTimes(1);
    expect(mockMaterializer.refresh).toHaveBeenCalledTimes(1);
  });

  it('should increment subscripciones on SubscripcionCreada and invalidate snapshot', () => {
    const event: SubscripcionCreadaPayload = {
      subscripcionId: 's-1',
      estudioId: 'e-1',
      planId: 'PROFESIONAL',
      occurredOn: new Date(),
    };
    listener.handleSubscripcionCreada(event);
    expect(mockProjection.incrementSubscripciones).toHaveBeenCalledTimes(1);
    expect(mockMaterializer.markStale).toHaveBeenCalledTimes(1);
  });

  it('should increment renovaciones on SubscripcionRenovada and invalidate snapshot', () => {
    const event: SubscripcionRenovadaPayload = {
      subscripcionId: 's-1',
      estudioId: 'e-1',
      nuevaFechaFin: new Date(),
      occurredOn: new Date(),
    };
    listener.handleSubscripcionRenovada(event);
    expect(mockProjection.incrementRenovaciones).toHaveBeenCalledTimes(1);
    expect(mockMaterializer.markStale).toHaveBeenCalledTimes(1);
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
    expect(mockMaterializer.markStale).toHaveBeenCalledTimes(1);
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
    expect(mockMaterializer.markStale).toHaveBeenCalledTimes(1);
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
    expect(mockMaterializer.markStale).toHaveBeenCalledTimes(1);
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
    expect(mockMaterializer.markStale).toHaveBeenCalledTimes(1);
  });

  it('should not throw when materializer operations fail', () => {
    mockMaterializer.markStale.mockRejectedValue(new Error('fail'));
    mockMaterializer.refresh.mockRejectedValue(new Error('fail'));

    const event: UsuarioRegistradoPayload = {
      usuarioId: 'u-1',
      email: 'test@test.com',
      occurredOn: new Date(),
    };
    expect(() => listener.handleUsuarioRegistrado(event)).not.toThrow();
  });

  it('should trigger refresh on every event type', () => {
    listener.handleUsuarioRegistrado({ usuarioId: 'u-1', email: 'a@b.com', occurredOn: new Date() });
    listener.handleSubscripcionCreada({ subscripcionId: 's-1', estudioId: 'e-1', planId: 'P', occurredOn: new Date() });
    listener.handleVencimientoCumplido({ vencimientoId: 'v-1', clienteId: 'c-1', tipoObligacion: 'IVA', periodo: '2026-04', occurredOn: new Date() });

    expect(mockMaterializer.refresh).toHaveBeenCalledTimes(3);
  });
});
