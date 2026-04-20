import { EntityManager } from '@mikro-orm/core';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';
import { ResumenMensualEntity } from '../../../notificaciones/infrastructure/persistence/resumen-mensual.schema';

export interface DescargarCalendarioPdfInput {
  clienteId: string;
  periodo: string;
}

export interface CalendarioPdfResult {
  buffer: Buffer;
  filename: string;
}

export class DescargarCalendarioPdfHandler {
  constructor(private readonly em: EntityManager) {}

  async execute(input: DescargarCalendarioPdfInput): Promise<CalendarioPdfResult> {
    const entity = await this.em.findOne(ResumenMensualEntity, {
      clienteId: input.clienteId,
      periodo: input.periodo,
      estado: 'LISTO',
    });

    if (!entity || !entity.pdfBuffer) {
      throw new RecursoNoEncontradoError('Calendario PDF');
    }

    const safeName = entity.clienteNombre.replace(/\s+/g, '-').toLowerCase();
    return {
      buffer: entity.pdfBuffer,
      filename: `calendario-${input.periodo}-${safeName}.pdf`,
    };
  }
}
