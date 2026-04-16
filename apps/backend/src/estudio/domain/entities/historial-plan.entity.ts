import { z } from 'zod';
import { BaseEntity, reconstituteEntity } from '../../../shared/domain';

interface CreateHistorialPlanProps {
  estudioId: string;
  planAnteriorId: string;
  planNuevoId: string;
  motivo?: string;
}

const historialPlanReconstitutePropsSchema = z.object({
  estudioId: z.string().min(1),
  planAnteriorId: z.string().min(1),
  planNuevoId: z.string().min(1),
  fechaCambio: z.date(),
  motivo: z.string().optional(),
});

export type ReconstituteHistorialPlanProps = z.input<typeof historialPlanReconstitutePropsSchema>;

export class HistorialPlan extends BaseEntity {
  private _estudioId!: string;
  private _planAnteriorId!: string;
  private _planNuevoId!: string;
  private _fechaCambio!: Date;
  private _motivo?: string;

  private constructor(props: CreateHistorialPlanProps, id?: string) {
    super(id);
    this._estudioId = props.estudioId;
    this._planAnteriorId = props.planAnteriorId;
    this._planNuevoId = props.planNuevoId;
    this._fechaCambio = new Date();
    this._motivo = props.motivo;
  }

  static create(props: CreateHistorialPlanProps, id?: string): HistorialPlan {
    return new HistorialPlan(props, id);
  }

  static reconstitute(props: ReconstituteHistorialPlanProps, id: string): HistorialPlan {
    const { instance, props: data } = reconstituteEntity(HistorialPlan, {
      schema: historialPlanReconstitutePropsSchema,
      props,
      id,
    });
    instance._estudioId = data.estudioId;
    instance._planAnteriorId = data.planAnteriorId;
    instance._planNuevoId = data.planNuevoId;
    instance._fechaCambio = data.fechaCambio;
    instance._motivo = data.motivo;
    return instance;
  }

  get estudioId(): string { return this._estudioId; }
  get planAnteriorId(): string { return this._planAnteriorId; }
  get planNuevoId(): string { return this._planNuevoId; }
  get fechaCambio(): Date { return this._fechaCambio; }
  get motivo(): string | undefined { return this._motivo; }
}
