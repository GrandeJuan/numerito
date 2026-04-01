import { BaseEntity } from '../../../shared/domain';

export const ORIGEN_NOTIFICACION = {
  ARCA: 'ARCA',
  ARBA: 'ARBA',
  AGIP: 'AGIP',
  EMAIL: 'EMAIL',
} as const;

export type OrigenNotificacion = (typeof ORIGEN_NOTIFICACION)[keyof typeof ORIGEN_NOTIFICACION];

export const ESTADO_NOTIFICACION = {
  PENDIENTE: 'PENDIENTE',
  LEIDA: 'LEIDA',
  GESTIONADA: 'GESTIONADA',
} as const;

export type EstadoNotificacion = (typeof ESTADO_NOTIFICACION)[keyof typeof ESTADO_NOTIFICACION];

interface CreateNotificacionFiscalProps {
  clienteId: string;
  tenantId: string;
  origen: OrigenNotificacion;
  cuitCliente: string;
  asunto: string;
  contenido: string;
  fechaNotificacion: Date;
}

export class NotificacionFiscal extends BaseEntity {
  private _clienteId: string;
  private _tenantId: string;
  private _origen: OrigenNotificacion;
  private _cuitCliente: string;
  private _asunto: string;
  private _contenido: string;
  private _fechaNotificacion: Date;
  private _estado: EstadoNotificacion;
  private _notaGestion?: string;

  private constructor(props: CreateNotificacionFiscalProps, id?: string) {
    super(id);
    this._clienteId = props.clienteId;
    this._tenantId = props.tenantId;
    this._origen = props.origen;
    this._cuitCliente = props.cuitCliente;
    this._asunto = props.asunto;
    this._contenido = props.contenido;
    this._fechaNotificacion = props.fechaNotificacion;
    this._estado = ESTADO_NOTIFICACION.PENDIENTE;
  }

  static create(props: CreateNotificacionFiscalProps, id?: string): NotificacionFiscal {
    return new NotificacionFiscal(props, id);
  }

  get clienteId(): string { return this._clienteId; }
  get tenantId(): string { return this._tenantId; }
  get origen(): OrigenNotificacion { return this._origen; }
  get cuitCliente(): string { return this._cuitCliente; }
  get asunto(): string { return this._asunto; }
  get contenido(): string { return this._contenido; }
  get fechaNotificacion(): Date { return this._fechaNotificacion; }
  get estado(): EstadoNotificacion { return this._estado; }
  get notaGestion(): string | undefined { return this._notaGestion; }

  marcarLeida(): void {
    this._estado = ESTADO_NOTIFICACION.LEIDA;
    this.updatedAt = new Date();
  }

  marcarGestionada(nota: string): void {
    this._estado = ESTADO_NOTIFICACION.GESTIONADA;
    this._notaGestion = nota;
    this.updatedAt = new Date();
  }
}
