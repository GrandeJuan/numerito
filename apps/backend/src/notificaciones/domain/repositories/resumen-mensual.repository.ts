import type { ResumenMensual } from '../entities/resumen-mensual.entity';

export interface ResumenMensualRepository {
  findById(id: string): Promise<ResumenMensual | null>;
  findByClienteAndPeriodo(
    estudioId: string,
    clienteId: string,
    periodo: string,
  ): Promise<ResumenMensual | null>;
  findByEstudioAndPeriodo(
    estudioId: string,
    periodo: string,
  ): Promise<ResumenMensual[]>;
  findByClienteRecientes(
    clienteId: string,
    limit: number,
  ): Promise<ResumenMensual[]>;
  save(entity: ResumenMensual): Promise<void>;
}

export const RESUMEN_MENSUAL_REPOSITORY = Symbol('ResumenMensualRepository');
