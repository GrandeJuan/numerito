import { z } from 'zod';
import { BaseEntity, reconstituteEntity } from '../../../shared/domain';
import { OperacionInvalidaError } from '../../../shared/domain/exceptions';

interface CreatePagoProps {
  facturaId: string;
  estudioId: string;
  fecha: Date;
  monto: number;
  medioPagoId: number;
  referencia?: string;
}

const pagoReconstitutePropsSchema = z.object({
  facturaId: z.string().min(1),
  estudioId: z.string().min(1),
  fecha: z.date(),
  monto: z.number(),
  medioPagoId: z.number(),
  referencia: z.string().optional(),
});

export type ReconstitutePagoProps = z.input<typeof pagoReconstitutePropsSchema>;

export class Pago extends BaseEntity {
  private _facturaId!: string;
  private _estudioId!: string;
  private _fecha!: Date;
  private _monto!: number;
  private _medioPagoId!: number;
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
    const { instance, props: data } = reconstituteEntity(Pago, {
      schema: pagoReconstitutePropsSchema,
      props,
      id,
    });
    instance._facturaId = data.facturaId;
    instance._estudioId = data.estudioId;
    instance._fecha = data.fecha;
    instance._monto = data.monto;
    instance._medioPagoId = data.medioPagoId;
    instance._referencia = data.referencia;
    return instance;
  }

  get facturaId(): string { return this._facturaId; }
  get estudioId(): string { return this._estudioId; }
  get fecha(): Date { return this._fecha; }
  get monto(): number { return this._monto; }
  get medioPagoId(): number { return this._medioPagoId; }
  get referencia(): string | undefined { return this._referencia; }
}
