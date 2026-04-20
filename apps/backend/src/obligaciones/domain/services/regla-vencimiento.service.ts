import type { TipoObligacion, Jurisdiccion } from '@numerito/shared';
import type { ReglaVencimientoEntityRepository } from '../repositories/regla-vencimiento.repository';
import { ReglaNoEncontradaError } from '../../../shared/domain/exceptions';
import { OperacionInvalidaError } from '../../../shared/domain/exceptions';
import type { ReglaVencimiento } from '../entities/regla-vencimiento.entity';

export interface PerfilFiscalInput {
  cuit: string;
  jurisdiccion: Jurisdiccion;
  regimen: string;
}

export class ReglaVencimientoService {
  constructor(
    private readonly reglaEntityRepo: ReglaVencimientoEntityRepository,
  ) {}

  /**
   * @deprecated Use calcularFechaConPerfil instead.
   * Legacy method that only takes CUIT and tipo — queries all active rules by tipo + terminacion.
   */
  async calcularFechaVencimiento(
    tipo: TipoObligacion,
    cuitRaw: string,
    periodo: string,
  ): Promise<Date> {
    const terminacion = cuitRaw.charAt(cuitRaw.length - 1);
    const [year, month] = periodo.split('-').map(Number);
    const fechaResolucion = new Date(year, month - 1, 1);

    // Find the first vigente rule for this tipo + terminacion (any jurisdiccion/regimen)
    const activas = await this.reglaEntityRepo.findActivas();
    const regla = activas.find(
      (r) =>
        r.tipoObligacion === tipo &&
        r.terminacionCuit === terminacion &&
        r.isVigenteAt(fechaResolucion),
    );

    if (!regla) {
      throw new ReglaNoEncontradaError(tipo, terminacion);
    }

    return regla.calcularFecha(periodo);
  }

  /**
   * New method that resolves the due date using PerfilFiscal (jurisdiccion + regimen + CUIT).
   * Finds the vigente rule for the given (tipo, jurisdiccion, regimen, terminacion) tuple.
   */
  async calcularFechaConPerfil(
    tipo: TipoObligacion,
    perfil: PerfilFiscalInput,
    periodo: string,
  ): Promise<Date> {
    const terminacion = perfil.cuit.charAt(perfil.cuit.length - 1);
    const [year, month] = periodo.split('-').map(Number);
    const fechaResolucion = new Date(year, month - 1, 1);

    const reglas = await this.reglaEntityRepo.findVigentes(
      tipo,
      perfil.jurisdiccion,
      perfil.regimen,
      terminacion,
      fechaResolucion,
    );

    if (reglas.length === 0) {
      throw new ReglaNoEncontradaError(tipo, terminacion);
    }

    if (reglas.length > 1) {
      throw new OperacionInvalidaError(
        `Hay ${reglas.length} reglas activas vigentes para ${tipo}/${perfil.jurisdiccion}/${perfil.regimen}/${terminacion} — se esperaba una sola`,
      );
    }

    return reglas[0].calcularFecha(periodo);
  }

  /**
   * Validates that a new rule does not conflict with existing active rules.
   * Returns the conflicting rule if found.
   */
  async validarSinConflicto(regla: ReglaVencimiento): Promise<ReglaVencimiento | null> {
    const existentes = await this.reglaEntityRepo.findActivas();
    for (const existente of existentes) {
      if (regla.conflictsWith(existente)) {
        return existente;
      }
    }
    return null;
  }
}
