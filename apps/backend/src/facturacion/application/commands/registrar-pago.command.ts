import type { FacturaRepository } from '../../domain/repositories/factura.repository';
import type { PagoRepository } from '../../domain/repositories/pago.repository';
import { Pago } from '../../domain/entities/pago.entity';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

export interface RegistrarPagoCommand {
  facturaId: string;
  monto: number;
  medioPagoId: number;
  referencia?: string;
}

export class RegistrarPagoHandler {
  constructor(
    private readonly facturaRepo: FacturaRepository,
    private readonly pagoRepo: PagoRepository,
  ) {}

  async execute(principal: EstudioPrincipal, command: RegistrarPagoCommand): Promise<Pago> {
    const factura = await this.facturaRepo.findById(principal, command.facturaId);
    if (!factura) throw new RecursoNoEncontradoError('Factura');

    factura.registrarPagoExterno(command.monto);

    const pago = Pago.create({
      facturaId: factura.id,
      estudioId: principal.estudioId,
      fecha: new Date(),
      monto: command.monto,
      medioPagoId: command.medioPagoId,
      referencia: command.referencia,
    });

    await this.facturaRepo.save(principal, factura);
    await this.pagoRepo.save(principal, pago);
    return pago;
  }
}
