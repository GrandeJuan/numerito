import { BaseRepository } from '../../../shared/domain';
import { Vencimiento, type EstadoVencimiento } from '../entities/vencimiento.entity';

export interface VencimientoRepository extends BaseRepository<Vencimiento> {
  findByClienteId(clienteId: string): Promise<Vencimiento[]>;
  findByPeriodo(periodo: string): Promise<Vencimiento[]>;
  findByEstado(estado: EstadoVencimiento): Promise<Vencimiento[]>;
  findProximosAVencer(diasAnticipacion: number): Promise<Vencimiento[]>;
}

export const VENCIMIENTO_REPOSITORY = Symbol('VencimientoRepository');
