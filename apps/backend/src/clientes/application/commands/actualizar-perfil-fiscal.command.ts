import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import type { ClienteRepository } from '../../domain/repositories/cliente.repository';
import type { EventBus } from '../../../shared/domain/event-bus';
import { InscripcionJurisdiccion } from '../../domain/value-objects/inscripcion-jurisdiccion.vo';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';
import type { Jurisdiccion } from '@numerito/shared';

export interface InscripcionJurisdiccionDto {
  jurisdiccion: string;
  regimen: string;
  activa: boolean;
  desde: string;
}

export interface ActualizarPerfilFiscalCommand {
  id: string;
  inscripciones: InscripcionJurisdiccionDto[];
}

export class ActualizarPerfilFiscalHandler {
  constructor(
    private readonly clienteRepo: ClienteRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    principal: EstudioPrincipal,
    command: ActualizarPerfilFiscalCommand,
  ): Promise<void> {
    const cliente = await this.clienteRepo.findById(principal, command.id);
    if (!cliente) throw new RecursoNoEncontradoError('Cliente');

    const inscripciones = command.inscripciones.map((i) =>
      InscripcionJurisdiccion.create({
        jurisdiccion: i.jurisdiccion as Jurisdiccion,
        regimen: i.regimen,
        activa: i.activa,
        desde: i.desde,
      }),
    );

    cliente.actualizarPerfilFiscal(inscripciones);
    await this.clienteRepo.save(principal, cliente);

    this.eventBus.publishAll(cliente.getDomainEvents());
    cliente.clearDomainEvents();
  }
}
