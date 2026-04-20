import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import type { VencimientoRepository } from '../../domain/repositories/vencimiento.repository';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

export interface MarcarNoAplicaCommand {
  vencimientoId: string;
  motivo: string;
}

export class MarcarNoAplicaHandler {
  constructor(
    private readonly vencimientoRepo: VencimientoRepository,
  ) {}

  async execute(principal: EstudioPrincipal, command: MarcarNoAplicaCommand) {
    const vencimiento = await this.vencimientoRepo.findById(principal, command.vencimientoId);
    if (!vencimiento) throw new RecursoNoEncontradoError('Vencimiento');

    vencimiento.marcarNoAplica(command.motivo);
    await this.vencimientoRepo.save(principal, vencimiento);

    return vencimiento;
  }
}
