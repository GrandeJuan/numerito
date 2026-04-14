import { BaseEntity } from '../../../shared/domain';
import { NombreEstudio } from '../value-objects/nombre-estudio.vo';
import { PlanSubscripcion } from '../value-objects/plan-subscripcion.vo';

interface CreateEstudioProps {
  nombre: NombreEstudio;
  plan: PlanSubscripcion;
  cuit: string;
}

interface ReconstituteEstudioProps extends CreateEstudioProps {
  isActive: boolean;
}

export class Estudio extends BaseEntity {
  private _nombre: NombreEstudio;
  private _plan: PlanSubscripcion;
  private _cuit: string;
  private _isActive: boolean;

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
    const instance = Object.create(Estudio.prototype) as Estudio;
    Object.defineProperty(instance, 'id', { value: id, writable: false, enumerable: true });
    Object.defineProperty(instance, 'createdAt', { value: new Date(), writable: false, enumerable: true });
    instance.updatedAt = new Date();
    Object.defineProperty(instance, '_domainEvents', { value: [], writable: true, enumerable: false });
    instance._nombre = props.nombre;
    instance._plan = props.plan;
    instance._cuit = props.cuit;
    instance._isActive = props.isActive;
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
