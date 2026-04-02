import { BaseEntity } from '../../../shared/domain';
import { OperacionInvalidaError } from '../../../shared/domain/exceptions';

export const ESTADO_FACTURA = {
  EMITIDA: 'EMITIDA',
  PARCIALMENTE_PAGADA: 'PARCIALMENTE_PAGADA',
  PAGADA: 'PAGADA',
  VENCIDA: 'VENCIDA',
  ANULADA: 'ANULADA',
} as const;

export type EstadoFactura = (typeof ESTADO_FACTURA)[keyof typeof ESTADO_FACTURA];

interface CreateFacturaProps {
  clienteId: string;
  tenantId: string;
  numero: string;
  fechaEmision: Date;
  fechaVencimiento: Date;
  subtotal: number;
  iva: number;
  total: number;
  concepto: string;
}

export class Factura extends BaseEntity {
  private _clienteId: string;
  private _tenantId: string;
  private _numero: string;
  private _fechaEmision: Date;
  private _fechaVencimiento: Date;
  private _subtotal: number;
  private _iva: number;
  private _total: number;
  private _concepto: string;
  private _estado: EstadoFactura;
  private _totalPagado: number;

  private constructor(props: CreateFacturaProps, id?: string) {
    super(id);
    if (props.subtotal < 0) {
      throw new OperacionInvalidaError('El subtotal no puede ser negativo');
    }
    if (props.iva < 0) {
      throw new OperacionInvalidaError('El IVA no puede ser negativo');
    }
    if (props.total < 0) {
      throw new OperacionInvalidaError('El total no puede ser negativo');
    }
    if (props.fechaEmision > props.fechaVencimiento) {
      throw new OperacionInvalidaError('La fecha de emision no puede ser posterior a la fecha de vencimiento');
    }
    this._clienteId = props.clienteId;
    this._tenantId = props.tenantId;
    this._numero = props.numero;
    this._fechaEmision = props.fechaEmision;
    this._fechaVencimiento = props.fechaVencimiento;
    this._subtotal = props.subtotal;
    this._iva = props.iva;
    this._total = props.total;
    this._concepto = props.concepto;
    this._estado = ESTADO_FACTURA.EMITIDA;
    this._totalPagado = 0;
  }

  static create(props: CreateFacturaProps, id?: string): Factura {
    return new Factura(props, id);
  }

  get clienteId(): string { return this._clienteId; }
  get tenantId(): string { return this._tenantId; }
  get numero(): string { return this._numero; }
  get fechaEmision(): Date { return this._fechaEmision; }
  get fechaVencimiento(): Date { return this._fechaVencimiento; }
  get subtotal(): number { return this._subtotal; }
  get iva(): number { return this._iva; }
  get total(): number { return this._total; }
  get concepto(): string { return this._concepto; }
  get estado(): EstadoFactura { return this._estado; }
  get totalPagado(): number { return this._totalPagado; }

  get saldoPendiente(): number {
    return this._total - this._totalPagado;
  }

  registrarPago(monto: number): void {
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
