import type { ClienteRepository } from '../../domain/repositories/cliente.repository';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';
import type { Cliente } from '../../domain/entities/cliente.entity';

export interface DesactivarClienteCommand {
  id: string;
}

export class DesactivarClienteHandler {
  constructor(private readonly clienteRepo: ClienteRepository) {}

  async execute(command: DesactivarClienteCommand): Promise<Cliente> {
    const cliente = await this.clienteRepo.findById(command.id);
    if (!cliente) throw new RecursoNoEncontradoError('Cliente');

    cliente.deactivate();
    await this.clienteRepo.save(cliente);
    return cliente;
  }
}
