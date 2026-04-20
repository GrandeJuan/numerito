import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import type { SugerenciaProrrogaRepository } from '../../domain/repositories/sugerencia-prorroga.repository';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

export interface DescartarSugerenciaProrrogaCommand {
  sugerenciaId: string;
}

export class DescartarSugerenciaProrrogaHandler {
  constructor(
    private readonly sugerenciaRepo: SugerenciaProrrogaRepository,
  ) {}

  async execute(principal: EstudioPrincipal, command: DescartarSugerenciaProrrogaCommand) {
    const sugerencia = await this.sugerenciaRepo.findById(principal, command.sugerenciaId);
    if (!sugerencia) throw new RecursoNoEncontradoError('SugerenciaProrroga');

    sugerencia.descartar();
    await this.sugerenciaRepo.save(principal, sugerencia);

    return sugerencia;
  }
}
