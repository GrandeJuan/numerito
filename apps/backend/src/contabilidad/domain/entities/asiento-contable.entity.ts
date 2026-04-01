import { BaseEntity } from '../../../shared/domain';

export interface LineaAsiento {
  cuentaId: string;
  debe: number;
  haber: number;
  descripcion: string;
}

interface CreateAsientoContableProps {
  libroId: string;
  clienteId: string;
  tenantId: string;
  fecha: Date;
  descripcion: string;
  lineas: LineaAsiento[];
}

export class AsientoContable extends BaseEntity {
  private _libroId: string;
  private _clienteId: string;
  private _tenantId: string;
  private _fecha: Date;
  private _descripcion: string;
  private _lineas: LineaAsiento[];

  private constructor(props: CreateAsientoContableProps, id?: string) {
    super(id);
    this._libroId = props.libroId;
    this._clienteId = props.clienteId;
    this._tenantId = props.tenantId;
    this._fecha = props.fecha;
    this._descripcion = props.descripcion;
    this._lineas = props.lineas;
  }

  static create(props: CreateAsientoContableProps, id?: string): AsientoContable {
    return new AsientoContable(props, id);
  }

  get libroId(): string { return this._libroId; }
  get clienteId(): string { return this._clienteId; }
  get tenantId(): string { return this._tenantId; }
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
    return Math.abs(this.totalDebe - this.totalHaber) < 0.01;
  }
}
