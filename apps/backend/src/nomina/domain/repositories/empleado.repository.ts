import { BaseRepository } from '../../../shared/domain';
import { Empleado } from '../entities/empleado.entity';

export interface EmpleadoRepository extends BaseRepository<Empleado> {
  findByClienteId(clienteId: string, tenantId: string): Promise<Empleado[]>;
  findByTenantId(tenantId: string): Promise<Empleado[]>;
}

export const EMPLEADO_REPOSITORY = Symbol('EmpleadoRepository');
