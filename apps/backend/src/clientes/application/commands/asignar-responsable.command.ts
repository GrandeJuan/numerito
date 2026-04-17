import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import type { ClienteRepository } from '../../domain/repositories/cliente.repository';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';
import type { Cliente } from '../../domain/entities/cliente.entity';

export interface AsignarResponsableCommand {
  id: string;
  responsableId: string;
}

export class AsignarResponsableHandler {
  constructor(private readonly clienteRepo: ClienteRepository) {}

  async execute(principal: EstudioPrincipal, command: AsignarResponsableCommand): Promise<Cliente> {
    const cliente = await this.clienteRepo.findById(principal, command.id);
    if (!cliente) throw new RecursoNoEncontradoError('Cliente');

    cliente.assignResponsable(command.responsableId);
    await this.clienteRepo.save(principal, cliente);
    return cliente;
  }
}
