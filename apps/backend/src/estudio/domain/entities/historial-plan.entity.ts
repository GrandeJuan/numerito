import { BaseEntity } from '../../../shared/domain';

interface CreateHistorialPlanProps {
  estudioId: string;
  planAnteriorId: string;
  planNuevoId: string;
  motivo?: string;
}

interface ReconstituteHistorialPlanProps extends CreateHistorialPlanProps {
  fechaCambio: Date;
}

export class HistorialPlan extends BaseEntity {
  private _estudioId: string;
  private _planAnteriorId: string;
  private _planNuevoId: string;
  private _fechaCambio: Date;
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
    const instance = Object.create(HistorialPlan.prototype) as HistorialPlan;
    Object.defineProperty(instance, 'id', { value: id, writable: false, enumerable: true });
    Object.defineProperty(instance, 'createdAt', { value: new Date(), writable: false, enumerable: true });
    instance.updatedAt = new Date();
    Object.defineProperty(instance, '_domainEvents', { value: [], writable: true, enumerable: false });
    instance._estudioId = props.estudioId;
    instance._planAnteriorId = props.planAnteriorId;
    instance._planNuevoId = props.planNuevoId;
    instance._fechaCambio = props.fechaCambio;
    instance._motivo = props.motivo;
    return instance;
  }

  get estudioId(): string { return this._estudioId; }
  get planAnteriorId(): string { return this._planAnteriorId; }
  get planNuevoId(): string { return this._planNuevoId; }
  get fechaCambio(): Date { return this._fechaCambio; }
  get motivo(): string | undefined { return this._motivo; }
}
