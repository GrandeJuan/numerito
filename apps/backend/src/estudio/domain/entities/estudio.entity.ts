import { z } from 'zod';
import { BaseEntity, reconstituteEntity } from '../../../shared/domain';
import { NombreEstudio } from '../value-objects/nombre-estudio.vo';
import { PlanSubscripcion } from '../value-objects/plan-subscripcion.vo';

interface CreateEstudioProps {
  nombre: NombreEstudio;
  plan: PlanSubscripcion;
  cuit: string;
}

const estudioReconstitutePropsSchema = z.object({
  nombre: z.instanceof(NombreEstudio),
  plan: z.instanceof(PlanSubscripcion),
  cuit: z.string().min(1),
  isActive: z.boolean(),
});

export type ReconstituteEstudioProps = z.input<typeof estudioReconstitutePropsSchema>;

export class Estudio extends BaseEntity {
  private _nombre!: NombreEstudio;
  private _plan!: PlanSubscripcion;
  private _cuit!: string;
  private _isActive!: boolean;

  private constructor(props: CreateEstudioProps, id?: string) {
    super(id);
    this._nombre = props.nombre;
    this._plan = props.plan;
    this._cuit = props.cuit;
    this._isActive = true;
  }

  static create(props: CreateEstudioProps, id?: string): Estudio {
    return new Estudio(props, id);
  }

  static reconstitute(props: ReconstituteEstudioProps, id: string): Estudio {
    const { instance, props: data } = reconstituteEntity(Estudio, {
      schema: estudioReconstitutePropsSchema,
      props,
      id,
    });
    instance._nombre = data.nombre;
    instance._plan = data.plan;
    instance._cuit = data.cuit;
    instance._isActive = data.isActive;
    return instance;
  }

  get nombre(): NombreEstudio { return this._nombre; }
  get plan(): PlanSubscripcion { return this._plan; }
  get cuit(): string { return this._cuit; }
  get isActive(): boolean { return this._isActive; }

  changePlan(newPlan: PlanSubscripcion): void {
    this._plan = newPlan;
    this.updatedAt = new Date();
  }

  updateNombre(newNombre: NombreEstudio): void {
    this._nombre = newNombre;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this._isActive = false;
    this.updatedAt = new Date();
  }

  activate(): void {
    this._isActive = true;
    this.updatedAt = new Date();
  }

  canAddCliente(currentCount: number): boolean {
    return currentCount < this._plan.maxClientes;
  }

  canAddUsuario(currentCount: number): boolean {
    return currentCount < this._plan.maxUsuarios;
  }
}
