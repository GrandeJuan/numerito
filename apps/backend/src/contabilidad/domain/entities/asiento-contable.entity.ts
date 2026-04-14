import { BaseEntity } from '../../../shared/domain';
import { OperacionInvalidaError } from '../../../shared/domain/exceptions';
import { ACCOUNTING } from '../../../shared/config/constants';

export interface LineaAsiento {
  cuentaId: string;
  debe: number;
  haber: number;
  descripcion: string;
}

interface CreateAsientoContableProps {
  libroId: string;
  clienteId: string;
  estudioId: string;
  fecha: Date;
  descripcion: string;
  lineas: LineaAsiento[];
}

type ReconstituteAsientoContableProps = CreateAsientoContableProps;

export class AsientoContable extends BaseEntity {
  private _libroId: string;
  private _clienteId: string;
  private _estudioId: string;
  private _fecha: Date;
  private _descripcion: string;
  private _lineas: LineaAsiento[];

  private constructor(props: CreateAsientoContableProps, id?: string) {
    super(id);
    if (props.lineas.length === 0) {
      throw new OperacionInvalidaError('El asiento debe tener al menos una linea');
    }
    const totalDebe = props.lineas.reduce((sum, l) => sum + l.debe, 0);
    const totalHaber = props.lineas.reduce((sum, l) => sum + l.haber, 0);
    if (Math.abs(totalDebe - totalHaber) >= ACCOUNTING.BALANCE_TOLERANCE) {
      throw new OperacionInvalidaError('El asiento contable debe estar balanceado');
    }
    this._libroId = props.libroId;
    this._clienteId = props.clienteId;
    this._estudioId = props.estudioId;
    this._fecha = props.fecha;
    this._descripcion = props.descripcion;
    this._lineas = props.lineas;
  }

  static create(props: CreateAsientoContableProps, id?: string): AsientoContable {
    return new AsientoContable(props, id);
  }

  static reconstitute(props: ReconstituteAsientoContableProps, id: string): AsientoContable {
    const instance = Object.create(AsientoContable.prototype) as AsientoContable;
    Object.defineProperty(instance, 'id', { value: id, writable: false, enumerable: true });
    Object.defineProperty(instance, 'createdAt', { value: new Date(), writable: false, enumerable: true });
    instance.updatedAt = new Date();
    Object.defineProperty(instance, '_domainEvents', { value: [], writable: true, enumerable: false });
    instance._libroId = props.libroId;
    instance._clienteId = props.clienteId;
    instance._estudioId = props.estudioId;
    instance._fecha = props.fecha;
    instance._descripcion = props.descripcion;
    instance._lineas = props.lineas;
    return instance;
  }

  get libroId(): string { return this._libroId; }
  get clienteId(): string { return this._clienteId; }
  get estudioId(): string { return this._estudioId; }
  get fecha(): Date { return this._fecha; }
  get descripcion(): string { return this._descripcion; }
  get lineas(): LineaAsiento[] { return [...this._lineas]; }

  get totalDebe(): number {
    return this._lineas.reduce((sum, l) => sum + l.debe, 0);
  }

  get totalHaber(): number {
    return this._lineas.reduce((sum, l) => sum + l.haber, 0);
  }

  get isBalanceado(): boolean {
    return Math.abs(this.totalDebe - this.totalHaber) < ACCOUNTING.BALANCE_TOLERANCE;
  }
}
