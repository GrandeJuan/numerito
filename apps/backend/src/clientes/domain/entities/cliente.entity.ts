import { z } from 'zod';
import { BaseEntity, reconstituteEntity } from '../../../shared/domain';
import { Cuit } from '../value-objects/cuit.vo';
import { RazonSocial } from '../value-objects/razon-social.vo';
import { InscripcionJurisdiccion } from '../value-objects/inscripcion-jurisdiccion.vo';
import type { InscripcionJurisdiccionProps } from '../value-objects/inscripcion-jurisdiccion.vo';
import { PerfilFiscalActualizado } from '../events/perfil-fiscal-actualizado.event';
import { InscripcionDuplicadaError, OperacionInvalidaError } from '../../../shared/domain/exceptions';
import { CONDICION_IVA, PROVINCIA, TIPO_CLIENTE, REGIMEN } from '@numerito/shared';
import type { CondicionIVA, Provincia, TipoCliente, Regimen } from '@numerito/shared';

export type { TipoCliente, Regimen };

interface CreateClienteProps {
  cuit: Cuit;
  razonSocial: RazonSocial;
  condicionIva: CondicionIVA;
  tipo: TipoCliente;
  regimen: Regimen;
  estudioId: string;
  provincias?: Provincia[];
}

const condicionIvaValues = Object.values(CONDICION_IVA) as [CondicionIVA, ...CondicionIVA[]];
const tipoClienteValues = Object.values(TIPO_CLIENTE) as [TipoCliente, ...TipoCliente[]];
const regimenValues = Object.values(REGIMEN) as [Regimen, ...Regimen[]];
const provinciaValues = Object.values(PROVINCIA) as [Provincia, ...Provincia[]];

const inscripcionJurisdiccionPropsSchema = z.object({
  jurisdiccion: z.string().min(1),
  regimen: z.string().min(1),
  activa: z.boolean(),
  desde: z.string().min(1),
});

const overrideResponsableSchema = z.record(z.string().min(1), z.string().min(1));

const clienteReconstitutePropsSchema = z.object({
  cuit: z.instanceof(Cuit),
  razonSocial: z.instanceof(RazonSocial),
  condicionIva: z.enum(condicionIvaValues),
  tipo: z.enum(tipoClienteValues),
  regimen: z.enum(regimenValues),
  estudioId: z.string().min(1),
  isActive: z.boolean(),
  responsableId: z.string().min(1).optional(),
  provincias: z.array(z.enum(provinciaValues)).optional(),
  inscripciones: z.array(inscripcionJurisdiccionPropsSchema).optional(),
  overridesResponsable: overrideResponsableSchema.optional(),
  diasAnticipacion: z.number().int().min(1).nullable().optional(),
});

export type ReconstituteClienteProps = z.input<typeof clienteReconstitutePropsSchema>;

export class Cliente extends BaseEntity {
  private _cuit!: Cuit;
  private _razonSocial!: RazonSocial;
  private _condicionIva!: CondicionIVA;
  private _tipo!: TipoCliente;
  private _regimen!: Regimen;
  private _estudioId!: string;
  private _isActive!: boolean;
  private _responsableId?: string;
  private _provincias!: Provincia[];
  private _inscripciones!: InscripcionJurisdiccion[];
  private _overridesResponsable!: Map<string, string>;
  private _diasAnticipacion!: number | null;

  private constructor(props: CreateClienteProps, id?: string) {
    super(id);
    this._cuit = props.cuit;
    this._razonSocial = props.razonSocial;
    this._condicionIva = props.condicionIva;
    this._tipo = props.tipo;
    this._regimen = props.regimen;
    this._estudioId = props.estudioId;
    this._isActive = true;
    this._provincias = props.provincias ?? [];
    this._inscripciones = [];
    this._overridesResponsable = new Map();
    this._diasAnticipacion = null;
  }

  static create(props: CreateClienteProps, id?: string): Cliente {
    return new Cliente(props, id);
  }

  static reconstitute(props: ReconstituteClienteProps, id: string): Cliente {
    const { instance, props: data } = reconstituteEntity(Cliente, {
      schema: clienteReconstitutePropsSchema,
      props,
      id,
    });
    instance._cuit = data.cuit;
    instance._razonSocial = data.razonSocial;
    instance._condicionIva = data.condicionIva;
    instance._tipo = data.tipo;
    instance._regimen = data.regimen;
    instance._estudioId = data.estudioId;
    instance._isActive = data.isActive;
    instance._responsableId = data.responsableId;
    instance._provincias = data.provincias ?? [];
    instance._inscripciones = (data.inscripciones ?? []).map((i) =>
      InscripcionJurisdiccion.reconstitute(i as InscripcionJurisdiccionProps),
    );
    instance._overridesResponsable = new Map(
      Object.entries(data.overridesResponsable ?? {}),
    );
    instance._diasAnticipacion = data.diasAnticipacion ?? null;
    return instance;
  }

  get cuit(): Cuit { return this._cuit; }
  get razonSocial(): RazonSocial { return this._razonSocial; }
  get condicionIva(): CondicionIVA { return this._condicionIva; }
  get tipo(): TipoCliente { return this._tipo; }
  get regimen(): Regimen { return this._regimen; }
  get estudioId(): string { return this._estudioId; }
  get isActive(): boolean { return this._isActive; }
  get responsableId(): string | undefined { return this._responsableId; }
  get provincias(): Provincia[] { return [...this._provincias]; }
  get inscripciones(): InscripcionJurisdiccion[] { return [...this._inscripciones]; }
  get overridesResponsable(): Record<string, string> { return Object.fromEntries(this._overridesResponsable); }
  get diasAnticipacion(): number | null { return this._diasAnticipacion; }

  changeCondicionIva(condicion: CondicionIVA): void {
    this._condicionIva = condicion;
    this.updatedAt = new Date();
  }

  updateRazonSocial(razonSocial: RazonSocial): void {
    this._razonSocial = razonSocial;
    this.updatedAt = new Date();
  }

  assignResponsable(responsableId: string): void {
    this._responsableId = responsableId;
    this.updatedAt = new Date();
  }

  changeRegimen(regimen: Regimen): void {
    this._regimen = regimen;
    this.updatedAt = new Date();
  }

  addProvincia(provincia: Provincia): void {
    if (!this._provincias.includes(provincia)) {
      this._provincias.push(provincia);
      this.updatedAt = new Date();
    }
  }

  removeProvincia(provincia: Provincia): void {
    this._provincias = this._provincias.filter(p => p !== provincia);
    this.updatedAt = new Date();
  }

  actualizarPerfilFiscal(inscripciones: InscripcionJurisdiccion[]): void {
    const activas = inscripciones.filter((i) => i.activa);
    for (let i = 0; i < activas.length; i++) {
      for (let j = i + 1; j < activas.length; j++) {
        if (activas[i].conMismaJurisdiccion(activas[j])) {
          throw new InscripcionDuplicadaError(activas[i].jurisdiccion, activas[i].regimen);
        }
      }
    }
    this._inscripciones = inscripciones;
    this.updatedAt = new Date();
    this.addDomainEvent(new PerfilFiscalActualizado(this.id, this._estudioId));
  }

  asignarResponsablePorObligacion(tipoObligacion: string, responsableId: string): void {
    if (!tipoObligacion || !responsableId) {
      throw new OperacionInvalidaError('Tipo de obligación y responsable son requeridos');
    }
    this._overridesResponsable.set(tipoObligacion, responsableId);
    this.updatedAt = new Date();
  }

  quitarOverrideResponsable(tipoObligacion: string): void {
    this._overridesResponsable.delete(tipoObligacion);
    this.updatedAt = new Date();
  }

  resolverResponsable(tipoObligacion: string): string | undefined {
    return this._overridesResponsable.get(tipoObligacion) ?? this._responsableId;
  }

  configurarDiasAnticipacion(dias: number | null): void {
    if (dias !== null && (dias < 1 || !Number.isInteger(dias))) {
      throw new OperacionInvalidaError('Los días de anticipación deben ser un entero >= 1');
    }
    this._diasAnticipacion = dias;
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
}
