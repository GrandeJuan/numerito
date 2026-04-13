import { BaseRepository } from '../../../shared/domain';
import { Empleado } from '../entities/empleado.entity';

export interface EmpleadoRepository extends BaseRepository<Empleado> {
  findByClienteId(clienteId: string): Promise<Empleado[]>;
}

export const EMPLEADO_REPOSITORY = Symbol('EmpleadoRepository');
