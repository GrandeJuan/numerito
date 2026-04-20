import type { ConfiguracionIngestaRepository } from '../../domain/repositories/configuracion-ingesta.repository';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

export interface ActualizarConfiguracionIngestaCommand {
  id: string;
  habilitado?: boolean;
  cadenciaDias?: number;
}

export class ActualizarConfiguracionIngestaHandler {
  constructor(private readonly repo: ConfiguracionIngestaRepository) {}

  async execute(command: ActualizarConfiguracionIngestaCommand): Promise<{ id: string }> {
    const config = await this.repo.findById(command.id);
    if (!config) throw new RecursoNoEncontradoError('ConfiguracionIngesta');
    config.actualizar({ habilitado: command.habilitado, cadenciaDias: command.cadenciaDias });
    await this.repo.save(config);
    return { id: config.id };
  }
}
