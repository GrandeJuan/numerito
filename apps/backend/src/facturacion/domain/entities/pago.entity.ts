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

interface ReconstitutePagoProps extends CreatePagoProps {}

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

  static reconstitute(props: ReconstitutePagoProps, id: string): Pago {
    const instance = Object.create(Pago.prototype) as Pago;
    Object.defineProperty(instance, 'id', { value: id, writable: false, enumerable: true });
    Object.defineProperty(instance, 'createdAt', { value: new Date(), writable: false, enumerable: true });
    instance.updatedAt = new Date();
    Object.defineProperty(instance, '_domainEvents', { value: [], writable: true, enumerable: false });
    instance._facturaId = props.facturaId;
    instance._estudioId = props.estudioId;
    instance._fecha = props.fecha;
    instance._monto = props.monto;
    instance._medioPagoId = props.medioPagoId;
    instance._referencia = props.referencia;
    return instance;
  }

  get facturaId(): string { return this._facturaId; }
  get estudioId(): string { return this._estudioId; }
  get fecha(): Date { return this._fecha; }
  get monto(): number { return this._monto; }
  get medioPagoId(): number { return this._medioPagoId; }
  get referencia(): string | undefined { return this._referencia; }
}
