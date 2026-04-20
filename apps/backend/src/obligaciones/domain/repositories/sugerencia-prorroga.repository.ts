import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import type { SugerenciaProrroga, EstadoSugerencia } from '../entities/sugerencia-prorroga.entity';

export interface SugerenciaProrrogaRepository {
  findById(principal: EstudioPrincipal, id: string): Promise<SugerenciaProrroga | null>;
  findByVencimientoId(principal: EstudioPrincipal, vencimientoId: string): Promise<SugerenciaProrroga[]>;
  findByEstado(principal: EstudioPrincipal, estado: EstadoSugerencia): Promise<SugerenciaProrroga[]>;
  findAbiertas(principal: EstudioPrincipal): Promise<SugerenciaProrroga[]>;
  save(principal: EstudioPrincipal, entity: SugerenciaProrroga): Promise<void>;
  delete(principal: EstudioPrincipal, entity: SugerenciaProrroga): Promise<void>;
}

export const SUGERENCIA_PRORROGA_REPOSITORY = Symbol('SugerenciaProrrogaRepository');
