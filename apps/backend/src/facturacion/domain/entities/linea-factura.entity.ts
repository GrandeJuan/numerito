import { BaseEntity } from '../../../shared/domain';
import { OperacionInvalidaError } from '../../../shared/domain/exceptions';

export interface LineaFacturaInput {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  alicuotaIva: number;
  id?: string;
}

interface CreateLineaFacturaProps {
  facturaId: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  alicuotaIva: number;
}

export class LineaFactura extends BaseEntity {
  private _facturaId: string;
  private _descripcion: string;
  private _cantidad: number;
  private _precioUnitario: number;
  private _alicuotaIva: number;

  private constructor(props: CreateLineaFacturaProps, id?: string) {
    super(id);
    if (props.cantidad <= 0) {
      throw new OperacionInvalidaError('La cantidad debe ser mayor a cero');
    }
    if (props.precioUnitario < 0) {
      throw new OperacionInvalidaError('El precio unitario no puede ser negativo');
    }
    if (props.alicuotaIva < 0) {
      throw new OperacionInvalidaError('La alicuota de IVA no puede ser negativa');
    }
    this._facturaId = props.facturaId;
    this._descripcion = props.descripcion;
    this._cantidad = props.cantidad;
    this._precioUnitario = props.precioUnitario;
    this._alicuotaIva = props.alicuotaIva;
  }

  static create(props: CreateLineaFacturaProps, id?: string): LineaFactura {
    return new LineaFactura(props, id);
  }

  get facturaId(): string { return this._facturaId; }
  get descripcion(): string { return this._descripcion; }
  get cantidad(): number { return this._cantidad; }
  get precioUnitario(): number { return this._precioUnitario; }
  get alicuotaIva(): number { return this._alicuotaIva; }

  get subtotal(): number {
    return this._cantidad * this._precioUnitario;
  }
}
