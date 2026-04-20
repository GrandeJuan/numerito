import type { CatalogoObligacionRepository } from '../../domain/repositories/catalogo-obligacion.repository';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

export interface ActualizarCatalogoObligacionCommand {
  id: string;
  nombre?: string;
  activo?: boolean;
}

export class ActualizarCatalogoObligacionHandler {
  constructor(private readonly repo: CatalogoObligacionRepository) {}

  async execute(command: ActualizarCatalogoObligacionCommand): Promise<{ id: string }> {
    const catalogo = await this.repo.findById(command.id);
    if (!catalogo) throw new RecursoNoEncontradoError('CatalogoObligacion');
    catalogo.actualizar({ nombre: command.nombre, activo: command.activo });
    await this.repo.save(catalogo);
    return { id: catalogo.id };
  }
}
