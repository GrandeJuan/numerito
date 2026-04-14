import { BaseEntity } from '../../../shared/domain';
import { OperacionInvalidaError } from '../../../shared/domain/exceptions';
import { SubscripcionCreada } from '../events/subscripcion-creada.event';
import { SubscripcionRenovada } from '../events/subscripcion-renovada.event';
import { SubscripcionCancelada } from '../events/subscripcion-cancelada.event';
import { SubscripcionVencida } from '../events/subscripcion-vencida.event';

export enum EstadoSubscripcion {
  TRIAL = 'TRIAL',
  ACTIVA = 'ACTIVA',
  SUSPENDIDA = 'SUSPENDIDA',
  CANCELADA = 'CANCELADA',
  VENCIDA = 'VENCIDA',
}

export enum CicloFacturacion {
  MENSUAL = 'MENSUAL',
  ANUAL = 'ANUAL',
}

interface CreateSubscripcionProps {
  estudioId: string;
  planId: string;
  fechaInicio: Date;
  fechaFin: Date;
  estado: EstadoSubscripcion;
  cicloFacturacion: CicloFacturacion;
  autoRenovacion: boolean;
}

export class Subscripcion extends BaseEntity {
  private _estudioId: string;
  private _planId: string;
  private _fechaInicio: Date;
  private _fechaFin: Date;
  private _estado: EstadoSubscripcion;
  private _cicloFacturacion: CicloFacturacion;
  private _autoRenovacion: boolean;

  private constructor(props: CreateSubscripcionProps, id?: string) {
    super(id);
    this._estudioId = props.estudioId;
    this._planId = props.planId;
    this._fechaInicio = props.fechaInicio;
    this._fechaFin = props.fechaFin;
    this._estado = props.estado;
    this._cicloFacturacion = props.cicloFacturacion;
    this._autoRenovacion = props.autoRenovacion;
  }

  static create(props: CreateSubscripcionProps, id?: string): Subscripcion {
    const sub = new Subscripcion(props, id);
    sub.addDomainEvent(new SubscripcionCreada(sub.id, props.estudioId, props.planId));
    return sub;
  }

  get estudioId(): string { return this._estudioId; }
  get planId(): string { return this._planId; }
  get fechaInicio(): Date { return this._fechaInicio; }
  get fechaFin(): Date { return this._fechaFin; }
  get estado(): EstadoSubscripcion { return this._estado; }
  get cicloFacturacion(): CicloFacturacion { return this._cicloFacturacion; }
  get autoRenovacion(): boolean { return this._autoRenovacion; }

  renovar(nuevaFechaFin: Date): void {
    if (this._estado === EstadoSubscripcion.CANCELADA || this._estado === EstadoSubscripcion.VENCIDA) {
      throw new OperacionInvalidaError(`No se puede renovar una subscripcion en estado ${this._estado}`);
    }
    this._fechaFin = nuevaFechaFin;
    this._estado = EstadoSubscripcion.ACTIVA;
    this.updatedAt = new Date();
    this.addDomainEvent(new SubscripcionRenovada(this.id, this._estudioId, nuevaFechaFin));
  }

  cancelar(): void {
    if (this._estado === EstadoSubscripcion.CANCELADA) {
      throw new OperacionInvalidaError('La subscripcion ya esta cancelada');
    }
    this._estado = EstadoSubscripcion.CANCELADA;
    this.updatedAt = new Date();
    this.addDomainEvent(new SubscripcionCancelada(this.id, this._estudioId));
  }

  suspender(): void {
    if (this._estado !== EstadoSubscripcion.ACTIVA) {
      throw new OperacionInvalidaError('Solo se puede suspender una subscripcion activa');
    }
    this._estado = EstadoSubscripcion.SUSPENDIDA;
    this.updatedAt = new Date();
  }

  reactivar(): void {
    if (this._estado !== EstadoSubscripcion.SUSPENDIDA) {
      throw new OperacionInvalidaError('Solo se puede reactivar una subscripcion suspendida');
    }
    this._estado = EstadoSubscripcion.ACTIVA;
    this.updatedAt = new Date();
  }

  marcarVencida(): void {
    if (this._estado === EstadoSubscripcion.CANCELADA) {
      throw new OperacionInvalidaError('No se puede marcar como vencida una subscripcion cancelada');
    }
    this._estado = EstadoSubscripcion.VENCIDA;
    this.updatedAt = new Date();
    this.addDomainEvent(new SubscripcionVencida(this.id, this._estudioId));
  }

  cambiarPlan(nuevoPlanId: string): void {
    if (this._estado !== EstadoSubscripcion.ACTIVA && this._estado !== EstadoSubscripcion.TRIAL) {
      throw new OperacionInvalidaError('Solo se puede cambiar el plan de una subscripcion activa o en trial');
    }
    this._planId = nuevoPlanId;
    this.updatedAt = new Date();
  }

  isActiva(): boolean {
    return this._estado === EstadoSubscripcion.ACTIVA || this._estado === EstadoSubscripcion.TRIAL;
  }

  diasRestantes(): number {
    const now = new Date();
    const diff = this._fechaFin.getTime() - now.getTime();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
