import type { Cliente } from '../../domain/entities/cliente.entity';

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
  };
}
