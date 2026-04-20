import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import type { ClienteRepository } from '../../domain/repositories/cliente.repository';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

export interface ConfigurarDiasAnticipacionCommand {
  clienteId: string;
  diasAnticipacion: number | null;
}

export class ConfigurarDiasAnticipacionHandler {
  constructor(private readonly clienteRepo: ClienteRepository) {}

  async execute(
    principal: EstudioPrincipal,
    command: ConfigurarDiasAnticipacionCommand,
  ) {
    const cliente = await this.clienteRepo.findById(principal, command.clienteId);
    if (!cliente) throw new RecursoNoEncontradoError('Cliente');

    cliente.configurarDiasAnticipacion(command.diasAnticipacion);
    await this.clienteRepo.save(principal, cliente);

    return { ok: true, diasAnticipacion: cliente.diasAnticipacion };
  }
}
