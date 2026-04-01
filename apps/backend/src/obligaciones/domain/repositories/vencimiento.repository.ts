import { BaseRepository } from '../../../shared/domain';
import { Vencimiento, type EstadoVencimiento } from '../entities/vencimiento.entity';

export interface VencimientoRepository extends BaseRepository<Vencimiento> {
  findByClienteId(clienteId: string, tenantId: string): Promise<Vencimiento[]>;
  findByTenantId(tenantId: string): Promise<Vencimiento[]>;
  findByPeriodo(periodo: string, tenantId: string): Promise<Vencimiento[]>;
  findByEstado(estado: EstadoVencimiento, tenantId: string): Promise<Vencimiento[]>;
  findProximosAVencer(diasAnticipacion: number, tenantId: string): Promise<Vencimiento[]>;
}

export const VENCIMIENTO_REPOSITORY = Symbol('VencimientoRepository');
