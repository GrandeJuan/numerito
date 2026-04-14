import { BaseEntity } from '../../../shared/domain';
import { OperacionInvalidaError } from '../../../shared/domain/exceptions';
import { LineaFactura } from './linea-factura.entity';
import type { LineaFacturaInput } from './linea-factura.entity';
import { ESTADO_FACTURA } from '@numerito/shared';
import type { EstadoFactura } from '@numerito/shared';

export { ESTADO_FACTURA };
export type { EstadoFactura };

interface CreateFacturaProps {
  clienteId: string;
  estudioId: string;
  numero: string;
  fechaEmision: Date;
  fechaVencimiento: Date;
  concepto: string;
  lineas: LineaFacturaInput[];
}

export class Factura extends BaseEntity {
  private _clienteId: string;
  private _estudioId: string;
  private _numero: string;
  private _fechaEmision: Date;
  private _fechaVencimiento: Date;
  private _concepto: string;
  private _lineas: LineaFactura[];
  private _estado: EstadoFactura;
  private _totalPagado: number;

  private constructor(props: CreateFacturaProps, id?: string) {
    super(id);
    if (props.lineas.length === 0) {
      throw new OperacionInvalidaError('La factura debe tener al menos una linea');
    }
    if (props.fechaEmision > props.fechaVencimiento) {
      throw new OperacionInvalidaError('La fecha de emision no puede ser posterior a la fecha de vencimiento');
    }
    this._clienteId = props.clienteId;
    this._estudioId = props.estudioId;
    this._numero = props.numero;
    this._fechaEmision = props.fechaEmision;
    this._fechaVencimiento = props.fechaVencimiento;
    this._concepto = props.concepto;
    this._lineas = props.lineas.map((l) =>
      LineaFactura.create(
        {
          facturaId: this.id,
          descripcion: l.descripcion,
          cantidad: l.cantidad,
          precioUnitario: l.precioUnitario,
          alicuotaIva: l.alicuotaIva,
        },
        l.id,
      ),
    );
    this._estado = ESTADO_FACTURA.EMITIDA;
    this._totalPagado = 0;
  }

  static create(props: CreateFacturaProps, id?: string): Factura {
    return new Factura(props, id);
  }

  get clienteId(): string { return this._clienteId; }
  get estudioId(): string { return this._estudioId; }
  get numero(): string { return this._numero; }
  get fechaEmision(): Date { return this._fechaEmision; }
  get fechaVencimiento(): Date { return this._fechaVencimiento; }
  get concepto(): string { return this._concepto; }
  get lineas(): readonly LineaFactura[] { return this._lineas; }
  get estado(): EstadoFactura { return this._estado; }
  get totalPagado(): number { return this._totalPagado; }

  get subtotal(): number {
    return this._lineas.reduce((sum, l) => sum + l.subtotal, 0);
  }

  get iva(): number {
    return this._lineas.reduce((sum, l) => sum + (l.subtotal * l.alicuotaIva / 100), 0);
  }

  get total(): number {
    return this.subtotal + this.iva;
  }

  get saldoPendiente(): number {
    return this.total - this._totalPagado;
  }

  registrarPagoExterno(monto: number): void {
    if (monto > this.saldoPendiente) {
      throw new OperacionInvalidaError('El pago excede el saldo pendiente');
    }
    this._totalPagado += monto;
    this._estado = this.saldoPendiente === 0
      ? ESTADO_FACTURA.PAGADA
      : ESTADO_FACTURA.PARCIALMENTE_PAGADA;
    this.updatedAt = new Date();
  }

  anular(): void {
    this._estado = ESTADO_FACTURA.ANULADA;
    this.updatedAt = new Date();
  }

  marcarVencida(): void {
    if (this._estado === ESTADO_FACTURA.EMITIDA || this._estado === ESTADO_FACTURA.PARCIALMENTE_PAGADA) {
      this._estado = ESTADO_FACTURA.VENCIDA;
      this.updatedAt = new Date();
    }
  }
}
