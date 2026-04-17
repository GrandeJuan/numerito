import type { LineaFacturaInput } from '../../domain/entities/linea-factura.entity';
import { Factura } from '../../domain/entities/factura.entity';
import type { FacturaRepository } from '../../domain/repositories/factura.repository';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

export interface CrearFacturaCommand {
  clienteId: string;
  numero: string;
  fechaEmision: string;
  fechaVencimiento: string;
  concepto: string;
  lineas: LineaFacturaInput[];
}

export class CrearFacturaHandler {
  constructor(
    private readonly facturaRepo: FacturaRepository,
  ) {}

  async execute(principal: EstudioPrincipal, command: CrearFacturaCommand): Promise<{ id: string }> {
    const factura = Factura.create({
      clienteId: command.clienteId,
      estudioId: principal.estudioId,
      numero: command.numero,
      fechaEmision: new Date(command.fechaEmision),
      fechaVencimiento: new Date(command.fechaVencimiento),
      concepto: command.concepto,
      lineas: command.lineas,
    });

    await this.facturaRepo.save(principal, factura);
    return { id: factura.id };
  }
}
