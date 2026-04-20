import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import type { EventBus } from '../../../shared/domain/event-bus';
import type { ClienteRepository } from '../../../clientes/domain/repositories/cliente.repository';
import { ProyectarCalendarioMensualHandler } from './proyectar-calendario-mensual.command';
import { CalendarioMensualListo } from '../../domain/events/calendario-mensual-listo.event';

export interface ProyectarCalendarioMasivoCommand {
  periodo: string; // YYYY-MM
}

export interface ProyectarCalendarioMasivoResult {
  clientesProcesados: number;
  clientesOmitidos: number;
  totalProyectados: number;
  errores: { clienteId: string; clienteNombre: string; error: string }[];
  resumenPorCliente: {
    clienteId: string;
    clienteNombre: string;
    proyectados: number;
  }[];
}

export class ProyectarCalendarioMasivoHandler {
  constructor(
    private readonly clienteRepo: ClienteRepository,
    private readonly proyectarHandler: ProyectarCalendarioMensualHandler,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    principal: EstudioPrincipal,
    command: ProyectarCalendarioMasivoCommand,
  ): Promise<ProyectarCalendarioMasivoResult> {
    const clientes = await this.clienteRepo.findAll(principal);
    const activeClientes = clientes.filter((c) => c.isActive);

    let clientesProcesados = 0;
    let clientesOmitidos = 0;
    let totalProyectados = 0;
    const errores: ProyectarCalendarioMasivoResult['errores'] = [];
    const resumenPorCliente: ProyectarCalendarioMasivoResult['resumenPorCliente'] = [];

    for (const cliente of activeClientes) {
      const nombre = cliente.razonSocial.value;

      // Skip clients without active inscripciones
      const inscripcionesActivas = cliente.inscripciones.filter((i) => i.activa);
      if (inscripcionesActivas.length === 0) {
        clientesOmitidos++;
        continue;
      }

      try {
        const result = await this.proyectarHandler.execute(principal, {
          clienteId: cliente.id,
          periodo: command.periodo,
        });

        clientesProcesados++;
        totalProyectados += result.proyectados;

        if (result.proyectados > 0) {
          resumenPorCliente.push({
            clienteId: cliente.id,
            clienteNombre: nombre,
            proyectados: result.proyectados,
          });

          // Emit calendario-mensual-listo per client that got projections
          this.eventBus.publish(
            new CalendarioMensualListo(
              principal.estudioId,
              cliente.id,
              nombre,
              command.periodo,
              result.proyectados,
            ),
          );
        }

        if (result.errores.length > 0) {
          errores.push({
            clienteId: cliente.id,
            clienteNombre: nombre,
            error: result.errores.join('; '),
          });
        }
      } catch (err) {
        clientesProcesados++;
        const msg = err instanceof Error ? err.message : String(err);
        errores.push({
          clienteId: cliente.id,
          clienteNombre: nombre,
          error: msg,
        });
      }
    }

    return {
      clientesProcesados,
      clientesOmitidos,
      totalProyectados,
      errores,
      resumenPorCliente,
    };
  }
}
