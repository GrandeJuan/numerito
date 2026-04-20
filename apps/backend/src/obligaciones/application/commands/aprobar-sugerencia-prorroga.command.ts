import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import type { SugerenciaProrrogaRepository } from '../../domain/repositories/sugerencia-prorroga.repository';
import type { ProrrogarVencimientoHandler } from './prorrogar-vencimiento.command';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

export interface AprobarSugerenciaProrrogaCommand {
  sugerenciaId: string;
}

export class AprobarSugerenciaProrrogaHandler {
  constructor(
    private readonly sugerenciaRepo: SugerenciaProrrogaRepository,
    private readonly prorrogarHandler: ProrrogarVencimientoHandler,
  ) {}

  async execute(principal: EstudioPrincipal, command: AprobarSugerenciaProrrogaCommand) {
    const sugerencia = await this.sugerenciaRepo.findById(principal, command.sugerenciaId);
    if (!sugerencia) throw new RecursoNoEncontradoError('SugerenciaProrroga');

    // Approve the suggestion
    sugerencia.aprobar();
    await this.sugerenciaRepo.save(principal, sugerencia);

    // Execute the actual prorroga on the vencimiento
    await this.prorrogarHandler.execute(principal, {
      vencimientoId: sugerencia.vencimientoId,
      motivo: `Prórroga automática por scraping: ${sugerencia.motivo}`,
      nuevaFecha: sugerencia.fechaSugerida.toISOString().slice(0, 10),
    });

    return sugerencia;
  }
}
