import { Injectable } from '@nestjs/common';

/**
 * In-memory read model for dashboard stats.
 * Event listeners update these counters as domain events flow in.
 *
 * For the current single-instance deployment, in-memory is sufficient.
 * Can be migrated to a denormalized DB table when horizontal scaling is needed.
 *
 * The existing SQL-based ObtenerAdminDashboardStatsHandler remains the source
 * of truth for historical data (sparklines, growth charts, etc.).
 * This projection tracks real-time deltas since last SQL refresh.
 */
@Injectable()
export class DashboardStatsProjection {
  private _usuariosRegistrados = 0;
  private _subscripcionesCreadas = 0;
  private _subscripcionesCanceladas = 0;
  private _subscripcionesRenovadas = 0;
  private _churnEvents = 0;
  private _vencimientosCumplidos = 0;
  private _vencimientosVencidos = 0;
  private _lastResetAt = new Date();

  incrementUsuarios(): void {
    this._usuariosRegistrados++;
  }

  incrementSubscripciones(): void {
    this._subscripcionesCreadas++;
  }

  decrementSubscripciones(): void {
    this._subscripcionesCanceladas++;
  }

  incrementRenovaciones(): void {
    this._subscripcionesRenovadas++;
  }

  incrementChurn(): void {
    this._churnEvents++;
  }

  incrementVencimientosCumplidos(): void {
    this._vencimientosCumplidos++;
  }

  incrementVencimientosVencidos(): void {
    this._vencimientosVencidos++;
  }

  getDeltas(): DashboardDeltas {
    return {
      usuariosRegistrados: this._usuariosRegistrados,
      subscripcionesCreadas: this._subscripcionesCreadas,
      subscripcionesCanceladas: this._subscripcionesCanceladas,
      subscripcionesRenovadas: this._subscripcionesRenovadas,
      churnEvents: this._churnEvents,
      vencimientosCumplidos: this._vencimientosCumplidos,
      vencimientosVencidos: this._vencimientosVencidos,
      sinceTimestamp: this._lastResetAt,
    };
  }

  reset(): void {
    this._usuariosRegistrados = 0;
    this._subscripcionesCreadas = 0;
    this._subscripcionesCanceladas = 0;
    this._subscripcionesRenovadas = 0;
    this._churnEvents = 0;
    this._vencimientosCumplidos = 0;
    this._vencimientosVencidos = 0;
    this._lastResetAt = new Date();
  }
}

export interface DashboardDeltas {
  usuariosRegistrados: number;
  subscripcionesCreadas: number;
  subscripcionesCanceladas: number;
  subscripcionesRenovadas: number;
  churnEvents: number;
  vencimientosCumplidos: number;
  vencimientosVencidos: number;
  sinceTimestamp: Date;
}
