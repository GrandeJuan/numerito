import type { TipoObligacion } from '@numerito/shared';
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
  findProximosAVencer(
    principal: EstudioPrincipal,
    diasAnticipacion: number,
  ): Promise<Vencimiento[]>;
  findByClienteAndPeriodo(
    principal: EstudioPrincipal,
    clienteId: string,
    periodo: string,
  ): Promise<Vencimiento[]>;
  /**
   * Create + persist a Vencimiento from primitives produced by external
   * pipelines (Excel import, scraping). Keeps entity factory inside obligaciones
   * so importing contexts do not reach for the domain class.
   */
  importar(principal: EstudioPrincipal, data: VencimientoImportData): Promise<void>;
  findClienteIdAndPeriodoKeys(
    principal: EstudioPrincipal,
    clienteId: string,
  ): Promise<Array<{ tipoObligacion: TipoObligacion; periodo: string }>>;
}

export interface VencimientoImportData {
  clienteId: string;
  estudioId: string;
  tipoObligacion: TipoObligacion;
  periodo: string;
  fechaVencimiento: Date;
  descripcion: string;
  estado: EstadoVencimiento;
}

export const VENCIMIENTO_REPOSITORY = Symbol('VencimientoRepository');
