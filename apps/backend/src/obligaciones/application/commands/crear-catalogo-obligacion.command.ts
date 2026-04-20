import type { CatalogoObligacionRepository } from '../../domain/repositories/catalogo-obligacion.repository';
import { CatalogoObligacion } from '../../domain/entities/catalogo-obligacion.entity';
import type { TipoObligacion, Jurisdiccion, FrecuenciaObligacion } from '@numerito/shared';

export interface CrearCatalogoObligacionCommand {
  nombre: string;
  tipoObligacion: string;
  jurisdiccion: string;
  frecuencia: string;
  activo?: boolean;
}

export class CrearCatalogoObligacionHandler {
  constructor(private readonly repo: CatalogoObligacionRepository) {}

  async execute(command: CrearCatalogoObligacionCommand): Promise<{ id: string }> {
    const catalogo = CatalogoObligacion.create({
      nombre: command.nombre,
      tipoObligacion: command.tipoObligacion as TipoObligacion,
      jurisdiccion: command.jurisdiccion as Jurisdiccion,
      frecuencia: command.frecuencia as FrecuenciaObligacion,
      activo: command.activo,
    });
    await this.repo.save(catalogo);
    return { id: catalogo.id };
  }
}
