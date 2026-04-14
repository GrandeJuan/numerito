import type { ClienteRepository } from '../../domain/repositories/cliente.repository';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';
import type { Cliente } from '../../domain/entities/cliente.entity';

export interface ActivarClienteCommand {
  id: string;
}

export class ActivarClienteHandler {
  constructor(private readonly clienteRepo: ClienteRepository) {}

  async execute(command: ActivarClienteCommand): Promise<Cliente> {
    const cliente = await this.clienteRepo.findById(command.id);
    if (!cliente) throw new RecursoNoEncontradoError('Cliente');

    cliente.activate();
    await this.clienteRepo.save(cliente);
    return cliente;
  }
}
