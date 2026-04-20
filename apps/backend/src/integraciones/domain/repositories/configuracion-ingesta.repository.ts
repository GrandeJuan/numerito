import type { ConfiguracionIngesta } from '../entities/configuracion-ingesta.entity';

export interface ConfiguracionIngestaRepository {
  findById(id: string): Promise<ConfiguracionIngesta | null>;
  findByFuente(fuente: string): Promise<ConfiguracionIngesta | null>;
  findAll(): Promise<ConfiguracionIngesta[]>;
  save(entity: ConfiguracionIngesta): Promise<void>;
  delete(entity: ConfiguracionIngesta): Promise<void>;
}

export const CONFIGURACION_INGESTA_REPOSITORY = Symbol('ConfiguracionIngestaRepository');
