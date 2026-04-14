import type { LineaFacturaInput } from '../../domain/entities/linea-factura.entity';
import { Factura } from '../../domain/entities/factura.entity';
import type { FacturaRepository } from '../../domain/repositories/factura.repository';
import type { TenantContext } from '../../../shared/domain/tenant-context';

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
    private readonly context: TenantContext,
  ) {}

  async execute(command: CrearFacturaCommand): Promise<{ id: string }> {
    const estudioId = this.context.estudioId;
    if (!estudioId) {
      throw new Error('Tenant context not available');
    }

    const factura = Factura.create({
      clienteId: command.clienteId,
      estudioId,
      numero: command.numero,
      fechaEmision: new Date(command.fechaEmision),
      fechaVencimiento: new Date(command.fechaVencimiento),
      concepto: command.concepto,
      lineas: command.lineas,
    });

    await this.facturaRepo.save(factura);
    return { id: factura.id };
  }
}
