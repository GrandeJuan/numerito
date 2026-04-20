import type { ReglaVencimientoEntityRepository } from '../../domain/repositories/regla-vencimiento.repository';
import { RecursoNoEncontradoError, OperacionInvalidaError } from '../../../shared/domain/exceptions';
import { ESTADO_REGLA } from '@numerito/shared';

export interface AprobarReglaPropuestaCommand {
  reglaId: string;
}

export class AprobarReglaPropuestaHandler {
  constructor(private readonly reglaRepo: ReglaVencimientoEntityRepository) {}

  async execute(command: AprobarReglaPropuestaCommand): Promise<{ id: string }> {
    const propuesta = await this.reglaRepo.findById(command.reglaId);
    if (!propuesta) throw new RecursoNoEncontradoError('ReglaVencimiento');

    if (propuesta.estado !== ESTADO_REGLA.PROPUESTA) {
      throw new OperacionInvalidaError('Solo se pueden aprobar reglas en estado PROPUESTA');
    }

    // Find and close vigencia of conflicting active rules
    const activas = await this.reglaRepo.findActivas();
    for (const activa of activas) {
      if (
        activa.tipoObligacion === propuesta.tipoObligacion &&
        activa.jurisdiccion === propuesta.jurisdiccion &&
        activa.regimen === propuesta.regimen &&
        activa.terminacionCuit === propuesta.terminacionCuit
      ) {
        // Close the old rule's vigencia the day before the new one starts
        const fechaCierre = new Date(propuesta.vigenciaDesde);
        fechaCierre.setDate(fechaCierre.getDate() - 1);
        activa.cerrarVigencia(fechaCierre);
        await this.reglaRepo.save(activa);
      }
    }

    propuesta.aprobar();
    await this.reglaRepo.save(propuesta);

    return { id: propuesta.id };
  }
}
