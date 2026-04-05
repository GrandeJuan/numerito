import { BaseEntity } from '../../../shared/domain';

export enum TipoNotificacion {
  VENCIMIENTO_PROXIMO = 'VENCIMIENTO_PROXIMO',
  TAREA_ASIGNADA = 'TAREA_ASIGNADA',
  PAGO_RECIBIDO = 'PAGO_RECIBIDO',
  SISTEMA = 'SISTEMA',
}

interface CreateNotificacionProps {
  usuarioId: string;
  estudioId?: string;
  tipo: TipoNotificacion;
  mensaje: string;
}

export class Notificacion extends BaseEntity {
  private _usuarioId: string;
  private _estudioId?: string;
  private _tipo: TipoNotificacion;
  private _mensaje: string;
  private _leida: boolean;

  private constructor(props: CreateNotificacionProps, id?: string) {
    super(id);
    this._usuarioId = props.usuarioId;
    this._estudioId = props.estudioId;
    this._tipo = props.tipo;
    this._mensaje = props.mensaje;
    this._leida = false;
  }

  static create(props: CreateNotificacionProps, id?: string): Notificacion {
    return new Notificacion(props, id);
  }

  get usuarioId(): string { return this._usuarioId; }
  get estudioId(): string | undefined { return this._estudioId; }
  get tipo(): TipoNotificacion { return this._tipo; }
  get mensaje(): string { return this._mensaje; }
  get leida(): boolean { return this._leida; }

  marcarLeida(): void {
    this._leida = true;
    this.updatedAt = new Date();
  }
}
