import type { CondicionIVA } from '@numerito/shared';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import { Cuit } from '../../domain/value-objects/cuit.vo';
import { RazonSocial } from '../../domain/value-objects/razon-social.vo';
import { Cliente, type TipoCliente, type Regimen } from '../../domain/entities/cliente.entity';
import type { ClienteRepository } from '../../domain/repositories/cliente.repository';
import { CuitDuplicadoError } from '../../../shared/domain/exceptions';

export interface CrearClienteCommand {
  cuit: string;
  razonSocial: string;
  condicionIva: CondicionIVA;
  tipo: TipoCliente;
  regimen: Regimen;
}

export class CrearClienteHandler {
  constructor(
    private readonly clienteRepo: ClienteRepository,
  ) {}

  async execute(principal: EstudioPrincipal, command: CrearClienteCommand): Promise<{ id: string }> {
    const cuit = Cuit.create(command.cuit);

    const existing = await this.clienteRepo.findByCuit(principal, cuit);
    if (existing) {
      throw new CuitDuplicadoError();
    }

    const cliente = Cliente.create({
      cuit,
      razonSocial: RazonSocial.create(command.razonSocial),
      condicionIva: command.condicionIva,
      tipo: command.tipo,
      regimen: command.regimen,
      estudioId: principal.estudioId,
    });

    await this.clienteRepo.save(principal, cliente);
    return { id: cliente.id };
  }
}
