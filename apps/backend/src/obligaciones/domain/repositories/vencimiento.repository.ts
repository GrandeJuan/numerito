import { BaseRepository } from '../../../shared/domain';
import { Vencimiento, type EstadoVencimiento } from '../entities/vencimiento.entity';

export interface VencimientoRepository extends BaseRepository<Vencimiento> {
  findByClienteId(clienteId: string, estudioId: string): Promise<Vencimiento[]>;
  findByEstudioId(estudioId: string): Promise<Vencimiento[]>;
  findByPeriodo(periodo: string, estudioId: string): Promise<Vencimiento[]>;
  findByEstado(estado: EstadoVencimiento, estudioId: string): Promise<Vencimiento[]>;
  findProximosAVencer(diasAnticipacion: number, estudioId: string): Promise<Vencimiento[]>;
}

export const VENCIMIENTO_REPOSITORY = Symbol('VencimientoRepository');
