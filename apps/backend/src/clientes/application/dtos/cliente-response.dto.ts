import type { Cliente } from '../../domain/entities/cliente.entity';

export interface InscripcionJurisdiccionResponseDto {
  jurisdiccion: string;
  regimen: string;
  activa: boolean;
  desde: string;
}

export interface ClienteResponseDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  cuit: string;
  razonSocial: string;
  condicionIva: string;
  tipo: string;
  regimen: string;
  estudioId: string;
  isActive: boolean;
  responsableId?: string;
  provincias?: string[];
  inscripciones: InscripcionJurisdiccionResponseDto[];
  overridesResponsable: Record<string, string>;
}

export function toClienteResponseDto(c: Cliente): ClienteResponseDto {
  return {
    id: c.id,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    cuit: c.cuit.value,
    razonSocial: c.razonSocial.value,
    condicionIva: c.condicionIva,
    tipo: c.tipo,
    regimen: c.regimen,
    estudioId: c.estudioId,
    isActive: c.isActive,
    responsableId: c.responsableId,
    provincias: c.provincias,
    inscripciones: c.inscripciones.map((i) => ({
      jurisdiccion: i.jurisdiccion,
      regimen: i.regimen,
      activa: i.activa,
      desde: i.desde,
    })),
    overridesResponsable: c.overridesResponsable,
  };
}
