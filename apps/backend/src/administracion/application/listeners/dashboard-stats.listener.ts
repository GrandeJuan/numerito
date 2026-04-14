import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IAM_EVENTS } from '../../../iam/application/public-events';
import type { UsuarioRegistradoPayload } from '../../../iam/application/public-events';
import { ESTUDIO_EVENTS } from '../../../estudio/application/public-events';
import type {
  SubscripcionCreadaPayload,
  SubscripcionRenovadaPayload,
  SubscripcionCanceladaPayload,
  SubscripcionVencidaPayload,
} from '../../../estudio/application/public-events';
import { OBLIGACIONES_EVENTS } from '../../../obligaciones/application/public-events';
import type {
  VencimientoCumplidoPayload,
  VencimientoVencidoPayload,
} from '../../../obligaciones/application/public-events';
import { DashboardStatsProjection } from '../services/dashboard-stats-projection';
import { MaterializeDashboardSnapshotService } from '../services/materialize-dashboard-snapshot.service';

/**
 * Listens to domain events from other bounded contexts and:
 * 1. Updates the in-memory projection (real-time deltas)
 * 2. Marks the snapshot as stale so the next read triggers re-materialization
 *
 * Anti-corruption layer: only imports public event interfaces,
 * never internal entities or repositories from other contexts.
 */
@Injectable()
export class DashboardStatsListener {
  constructor(
    private readonly projection: DashboardStatsProjection,
    private readonly materializer: MaterializeDashboardSnapshotService,
  ) {}

  @OnEvent(IAM_EVENTS.USUARIO_REGISTRADO)
  handleUsuarioRegistrado(_event: UsuarioRegistradoPayload): void {
    this.projection.incrementUsuarios();
    this.invalidateSnapshot();
  }

  @OnEvent(ESTUDIO_EVENTS.SUBSCRIPCION_CREADA)
  handleSubscripcionCreada(_event: SubscripcionCreadaPayload): void {
    this.projection.incrementSubscripciones();
    this.invalidateSnapshot();
  }

  @OnEvent(ESTUDIO_EVENTS.SUBSCRIPCION_RENOVADA)
  handleSubscripcionRenovada(_event: SubscripcionRenovadaPayload): void {
    this.projection.incrementRenovaciones();
    this.invalidateSnapshot();
  }

  @OnEvent(ESTUDIO_EVENTS.SUBSCRIPCION_CANCELADA)
  handleSubscripcionCancelada(_event: SubscripcionCanceladaPayload): void {
    this.projection.decrementSubscripciones();
    this.projection.incrementChurn();
    this.invalidateSnapshot();
  }

  @OnEvent(ESTUDIO_EVENTS.SUBSCRIPCION_VENCIDA)
  handleSubscripcionVencida(_event: SubscripcionVencidaPayload): void {
    this.projection.decrementSubscripciones();
    this.invalidateSnapshot();
  }

  @OnEvent(OBLIGACIONES_EVENTS.VENCIMIENTO_CUMPLIDO)
  handleVencimientoCumplido(_event: VencimientoCumplidoPayload): void {
    this.projection.incrementVencimientosCumplidos();
    this.invalidateSnapshot();
  }

  @OnEvent(OBLIGACIONES_EVENTS.VENCIMIENTO_VENCIDO)
  handleVencimientoVencido(_event: VencimientoVencidoPayload): void {
    this.projection.incrementVencimientosVencidos();
    this.invalidateSnapshot();
  }

  private invalidateSnapshot(): void {
    // Mark stale + trigger throttled refresh (fire-and-forget)
    this.materializer.markStale().catch(() => {});
    this.materializer.refresh().catch(() => {});
  }
}
