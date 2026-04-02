import { BaseEntity } from '../../../shared/domain';
import { OperacionInvalidaError } from '../../../shared/domain/exceptions';

interface CreatePagoProps {
  facturaId: string;
  estudioId: string;
  fecha: Date;
  monto: number;
  medioPagoId: number;
  referencia?: string;
}

export class Pago extends BaseEntity {
  private _facturaId: string;
  private _estudioId: string;
  private _fecha: Date;
  private _monto: number;
  private _medioPagoId: number;
  private _referencia?: string;

  private constructor(props: CreatePagoProps, id?: string) {
    super(id);
    if (props.monto <= 0) {
      throw new OperacionInvalidaError('El monto debe ser mayor a cero');
    }
    this._facturaId = props.facturaId;
    this._estudioId = props.estudioId;
    this._fecha = props.fecha;
    this._monto = props.monto;
    this._medioPagoId = props.medioPagoId;
    this._referencia = props.referencia;
  }

  static create(props: CreatePagoProps, id?: string): Pago {
    return new Pago(props, id);
  }

  get facturaId(): string { return this._facturaId; }
  get estudioId(): string { return this._estudioId; }
  get fecha(): Date { return this._fecha; }
  get monto(): number { return this._monto; }
  get medioPagoId(): number { return this._medioPagoId; }
  get referencia(): string | undefined { return this._referencia; }
}
