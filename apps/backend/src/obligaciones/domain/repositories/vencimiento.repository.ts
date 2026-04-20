import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import { Vencimiento, type EstadoVencimiento } from '../entities/vencimiento.entity';

export interface VencimientoRepository {
  findById(principal: EstudioPrincipal, id: string): Promise<Vencimiento | null>;
  findAll(principal: EstudioPrincipal): Promise<Vencimiento[]>;
  save(principal: EstudioPrincipal, entity: Vencimiento): Promise<void>;
  delete(principal: EstudioPrincipal, entity: Vencimiento): Promise<void>;
  findByClienteId(principal: EstudioPrincipal, clienteId: string): Promise<Vencimiento[]>;
  findByPeriodo(principal: EstudioPrincipal, periodo: string): Promise<Vencimiento[]>;
  findByEstado(principal: EstudioPrincipal, estado: EstadoVencimiento): Promise<Vencimiento[]>;
  findProximosAVencer(principal: EstudioPrincipal, diasAnticipacion: number): Promise<Vencimiento[]>;
  findByClienteAndPeriodo(principal: EstudioPrincipal, clienteId: string, periodo: string): Promise<Vencimiento[]>;
}

export const VENCIMIENTO_REPOSITORY = Symbol('VencimientoRepository');
