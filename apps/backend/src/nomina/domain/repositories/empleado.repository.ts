import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import { Empleado } from '../entities/empleado.entity';

export interface EmpleadoRepository {
  findById(principal: EstudioPrincipal, id: string): Promise<Empleado | null>;
  findAll(principal: EstudioPrincipal): Promise<Empleado[]>;
  save(principal: EstudioPrincipal, entity: Empleado): Promise<void>;
  delete(principal: EstudioPrincipal, entity: Empleado): Promise<void>;
  findByClienteId(principal: EstudioPrincipal, clienteId: string): Promise<Empleado[]>;
}

export const EMPLEADO_REPOSITORY = Symbol('EmpleadoRepository');
