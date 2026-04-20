import type { ResumenMensualRepository } from '../../../notificaciones/domain/repositories/resumen-mensual.repository';

export interface ObtenerResumenesClienteInput {
  clienteId: string;
  limit?: number;
}

export interface ResumenMensualDto {
  id: string;
  periodo: string;
  totalVencimientos: number;
  estado: string;
  emailEnviado: boolean;
  createdAt: Date;
}

export class ObtenerResumenesClienteHandler {
  constructor(private readonly resumenRepo: ResumenMensualRepository) {}

  async execute(input: ObtenerResumenesClienteInput): Promise<ResumenMensualDto[]> {
    const resumenes = await this.resumenRepo.findByClienteRecientes(
      input.clienteId,
      input.limit ?? 12,
    );

    return resumenes.map((r) => ({
      id: r.id,
      periodo: r.periodo,
      totalVencimientos: r.totalVencimientos,
      estado: r.estado,
      emailEnviado: r.emailEnviado,
      createdAt: r.createdAt,
    }));
  }
}
