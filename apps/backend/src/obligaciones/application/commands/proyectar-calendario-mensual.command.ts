import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import type { EventBus } from '../../../shared/domain/event-bus';
import type { VencimientoRepository } from '../../domain/repositories/vencimiento.repository';
import type { CatalogoObligacionRepository } from '../../domain/repositories/catalogo-obligacion.repository';
import type { ClienteRepository } from '../../../clientes/domain/repositories/cliente.repository';
import { ReglaVencimientoService } from '../../domain/services/regla-vencimiento.service';
import { AjusteDiaHabilService } from '../../domain/services/ajuste-dia-habil.service';
import { Vencimiento } from '../../domain/entities/vencimiento.entity';
import { VencimientoProyectado } from '../../domain/events/vencimiento-proyectado.event';
import {
  RecursoNoEncontradoError,
  OperacionInvalidaError,
} from '../../../shared/domain/exceptions';
import type { TipoObligacion } from '@numerito/shared';

export interface ProyectarCalendarioMensualCommand {
  clienteId: string;
  periodo: string; // YYYY-MM
}

export interface ProyectarCalendarioResult {
  proyectados: number;
  omitidos: number;
  errores: string[];
}

export class ProyectarCalendarioMensualHandler {
  constructor(
    private readonly vencimientoRepo: VencimientoRepository,
    private readonly clienteRepo: ClienteRepository,
    private readonly catalogoRepo: CatalogoObligacionRepository,
    private readonly reglaService: ReglaVencimientoService,
    private readonly ajusteService: AjusteDiaHabilService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    principal: EstudioPrincipal,
    command: ProyectarCalendarioMensualCommand,
  ): Promise<ProyectarCalendarioResult> {
    const cliente = await this.clienteRepo.findById(principal, command.clienteId);
    if (!cliente) {
      throw new RecursoNoEncontradoError('Cliente');
    }

    const inscripcionesActivas = cliente.inscripciones.filter((i) => i.activa);
    if (inscripcionesActivas.length === 0) {
      throw new OperacionInvalidaError(
        'El cliente no tiene inscripciones activas en su perfil fiscal',
      );
    }

    // Load existing vencimientos for idempotency check
    const existentes = await this.vencimientoRepo.findByClienteAndPeriodo(
      principal,
      command.clienteId,
      command.periodo,
    );
    const existenteKeys = new Set(
      existentes.map((v) => `${v.tipoObligacion}::${v.periodo}`),
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let proyectados = 0;
    let omitidos = 0;
    const errores: string[] = [];
    const events: VencimientoProyectado[] = [];

    for (const inscripcion of inscripcionesActivas) {
      // Find active catalog entries for this jurisdiction
      const obligaciones = await this.catalogoRepo.findByJurisdiccion(inscripcion.jurisdiccion);
      const activas = obligaciones.filter((o) => o.activo);

      for (const obligacion of activas) {
        const key = `${obligacion.tipoObligacion}::${command.periodo}`;

        // Idempotency: skip if already projected
        if (existenteKeys.has(key)) {
          omitidos++;
          continue;
        }

        try {
          const fechaNominal = await this.reglaService.calcularFechaConPerfil(
            obligacion.tipoObligacion as TipoObligacion,
            {
              cuit: cliente.cuit.raw,
              jurisdiccion: inscripcion.jurisdiccion,
              regimen: inscripcion.regimen,
            },
            command.periodo,
          );

          // Adjust for weekends and holidays
          const fechaAjustada = await this.ajusteService.ajustar(
            fechaNominal,
            inscripcion.jurisdiccion,
          );

          // Skip past dates — can't create vencimientos in the past
          const fechaDay = new Date(fechaAjustada);
          fechaDay.setHours(0, 0, 0, 0);
          if (fechaDay < today) {
            omitidos++;
            continue;
          }

          const responsableId = cliente.resolverResponsable(obligacion.tipoObligacion);

          const vencimiento = Vencimiento.create({
            clienteId: command.clienteId,
            estudioId: principal.estudioId,
            tipoObligacion: obligacion.tipoObligacion as TipoObligacion,
            periodo: command.periodo,
            fechaVencimiento: fechaAjustada,
            fechaNominal,
            descripcion: obligacion.nombre,
            responsableId: responsableId ?? null,
          });

          await this.vencimientoRepo.save(principal, vencimiento);
          existenteKeys.add(key);
          proyectados++;

          events.push(
            new VencimientoProyectado(
              vencimiento.id,
              command.clienteId,
              obligacion.tipoObligacion,
              command.periodo,
              principal.estudioId,
            ),
          );
        } catch (err) {
          // Log the error but continue projecting other obligations
          const msg =
            err instanceof Error ? err.message : String(err);
          errores.push(`${obligacion.tipoObligacion}: ${msg}`);
        }
      }
    }

    // Publish all events after successful saves
    if (events.length > 0) {
      this.eventBus.publishAll(events);
    }

    return { proyectados, omitidos, errores };
  }
}
