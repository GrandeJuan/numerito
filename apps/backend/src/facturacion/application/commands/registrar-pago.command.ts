import type { FacturaRepository } from '../../domain/repositories/factura.repository';
import type { PagoRepository } from '../../domain/repositories/pago.repository';
import { Pago } from '../../domain/entities/pago.entity';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

export interface RegistrarPagoCommand {
  facturaId: string;
  estudioId: string;
  monto: number;
  medioPagoId: number;
  referencia?: string;
}

export class RegistrarPagoHandler {
  constructor(
    private readonly facturaRepo: FacturaRepository,
    private readonly pagoRepo: PagoRepository,
  ) {}

  async execute(command: RegistrarPagoCommand): Promise<Pago> {
    const factura = await this.facturaRepo.findById(command.facturaId);
    if (!factura) throw new RecursoNoEncontradoError('Factura');

    factura.registrarPagoExterno(command.monto);

    const pago = Pago.create({
      facturaId: factura.id,
      estudioId: command.estudioId,
      fecha: new Date(),
      monto: command.monto,
      medioPagoId: command.medioPagoId,
      referencia: command.referencia,
    });

    await this.facturaRepo.save(factura);
    await this.pagoRepo.save(pago);
    return pago;
  }
}
