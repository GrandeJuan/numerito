import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IAM_EVENTS } from '../../../iam/application/public-events';
import type { UsuarioRegistradoPayload } from '../../../iam/application/public-events';
import { ESTUDIO_EVENTS } from '../../../estudio/application/public-events';
import type {
  SubscripcionCreadaPayload,
  SubscripcionCanceladaPayload,
  SubscripcionVencidaPayload,
} from '../../../estudio/application/public-events';
import type { DashboardStatsProjection } from '../services/dashboard-stats-projection';

/**
 * Listens to domain events from other bounded contexts and updates
 * the dashboard stats projection (in-memory read model).
 *
 * This is the anti-corruption layer: we only import public event
 * interfaces, never internal entities or repositories from other contexts.
 */
@Injectable()
export class DashboardStatsListener {
  constructor(private readonly projection: DashboardStatsProjection) {}

  @OnEvent(IAM_EVENTS.USUARIO_REGISTRADO)
  handleUsuarioRegistrado(event: UsuarioRegistradoPayload): void {
    this.projection.incrementUsuarios();
  }

  @OnEvent(ESTUDIO_EVENTS.SUBSCRIPCION_CREADA)
  handleSubscripcionCreada(event: SubscripcionCreadaPayload): void {
    this.projection.incrementSubscripciones();
  }

  @OnEvent(ESTUDIO_EVENTS.SUBSCRIPCION_CANCELADA)
  handleSubscripcionCancelada(event: SubscripcionCanceladaPayload): void {
    this.projection.decrementSubscripciones();
    this.projection.incrementChurn();
  }

  @OnEvent(ESTUDIO_EVENTS.SUBSCRIPCION_VENCIDA)
  handleSubscripcionVencida(event: SubscripcionVencidaPayload): void {
    this.projection.decrementSubscripciones();
  }
}
