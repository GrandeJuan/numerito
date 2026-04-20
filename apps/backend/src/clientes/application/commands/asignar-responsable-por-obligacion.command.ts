import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import type { ClienteRepository } from '../../domain/repositories/cliente.repository';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

export interface AsignarResponsablePorObligacionCommand {
  clienteId: string;
  tipoObligacion: string;
  responsableId: string;
}

export class AsignarResponsablePorObligacionHandler {
  constructor(private readonly clienteRepo: ClienteRepository) {}

  async execute(
    principal: EstudioPrincipal,
    command: AsignarResponsablePorObligacionCommand,
  ): Promise<void> {
    const cliente = await this.clienteRepo.findById(principal, command.clienteId);
    if (!cliente) throw new RecursoNoEncontradoError('Cliente');

    cliente.asignarResponsablePorObligacion(command.tipoObligacion, command.responsableId);
    await this.clienteRepo.save(principal, cliente);
  }
}
