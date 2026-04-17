import type { CondicionIVA } from '@numerito/shared';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import { RazonSocial } from '../../domain/value-objects/razon-social.vo';
import type { Regimen } from '../../domain/entities/cliente.entity';
import type { ClienteRepository } from '../../domain/repositories/cliente.repository';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';
import type { Cliente } from '../../domain/entities/cliente.entity';

export interface ActualizarClienteCommand {
  id: string;
  razonSocial?: string;
  condicionIva?: string;
  regimen?: string;
}

export class ActualizarClienteHandler {
  constructor(private readonly clienteRepo: ClienteRepository) {}

  async execute(principal: EstudioPrincipal, command: ActualizarClienteCommand): Promise<Cliente> {
    const cliente = await this.clienteRepo.findById(principal, command.id);
    if (!cliente) throw new RecursoNoEncontradoError('Cliente');

    if (command.razonSocial) {
      cliente.updateRazonSocial(RazonSocial.create(command.razonSocial));
    }
    if (command.condicionIva) {
      cliente.changeCondicionIva(command.condicionIva as CondicionIVA);
    }
    if (command.regimen) {
      cliente.changeRegimen(command.regimen as Regimen);
    }

    await this.clienteRepo.save(principal, cliente);
    return cliente;
  }
}
