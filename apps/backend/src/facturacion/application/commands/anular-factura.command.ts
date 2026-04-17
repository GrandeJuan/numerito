import type { FacturaRepository } from '../../domain/repositories/factura.repository';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';
import type { Factura } from '../../domain/entities/factura.entity';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

export interface AnularFacturaCommand {
  id: string;
}

export class AnularFacturaHandler {
  constructor(private readonly facturaRepo: FacturaRepository) {}

  async execute(principal: EstudioPrincipal, command: AnularFacturaCommand): Promise<Factura> {
    const factura = await this.facturaRepo.findById(principal, command.id);
    if (!factura) throw new RecursoNoEncontradoError('Factura');

    factura.anular();
    await this.facturaRepo.save(principal, factura);
    return factura;
  }
}
