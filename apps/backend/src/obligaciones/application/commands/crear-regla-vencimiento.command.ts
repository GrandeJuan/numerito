import type { ReglaVencimientoEntityRepository } from '../../domain/repositories/regla-vencimiento.repository';
import { ReglaVencimiento } from '../../domain/entities/regla-vencimiento.entity';
import { ReglaVencimientoService } from '../../domain/services/regla-vencimiento.service';
import { OperacionInvalidaError } from '../../../shared/domain/exceptions';
import type { TipoObligacion, Jurisdiccion, OrigenRegla, EstadoRegla } from '@numerito/shared';

export interface CrearReglaVencimientoCommand {
  tipoObligacion: string;
  jurisdiccion: string;
  regimen: string;
  terminacionCuit: string;
  diaVencimiento: number;
  mesSiguiente: boolean;
  vigenciaDesde: string;
  vigenciaHasta?: string | null;
  origen?: string;
  estado?: string;
}

export class CrearReglaVencimientoHandler {
  constructor(
    private readonly reglaRepo: ReglaVencimientoEntityRepository,
    private readonly reglaService: ReglaVencimientoService,
  ) {}

  async execute(command: CrearReglaVencimientoCommand): Promise<{ id: string }> {
    const regla = ReglaVencimiento.create({
      tipoObligacion: command.tipoObligacion as TipoObligacion,
      jurisdiccion: command.jurisdiccion as Jurisdiccion,
      regimen: command.regimen,
      terminacionCuit: command.terminacionCuit,
      diaVencimiento: command.diaVencimiento,
      mesSiguiente: command.mesSiguiente,
      vigenciaDesde: new Date(command.vigenciaDesde),
      vigenciaHasta: command.vigenciaHasta ? new Date(command.vigenciaHasta) : null,
      origen: (command.origen as OrigenRegla) ?? undefined,
      estado: (command.estado as EstadoRegla) ?? undefined,
    });

    const conflicto = await this.reglaService.validarSinConflicto(regla);
    if (conflicto) {
      throw new OperacionInvalidaError(
        `Conflicto con regla existente (id=${conflicto.id}): misma combinación tipo/jurisdicción/régimen/terminación con vigencias solapadas`,
      );
    }

    await this.reglaRepo.save(regla);
    return { id: regla.id };
  }
}
