import type { AprobarReglaPropuestaHandler } from './aprobar-regla-propuesta.command';

export interface AprobarReglasBloqueCommand {
  reglaIds: string[];
}

export interface AprobarReglasBloqueResult {
  aprobadas: string[];
  errores: { reglaId: string; error: string }[];
}

export class AprobarReglasBloqueHandler {
  constructor(private readonly aprobarHandler: AprobarReglaPropuestaHandler) {}

  async execute(command: AprobarReglasBloqueCommand): Promise<AprobarReglasBloqueResult> {
    const aprobadas: string[] = [];
    const errores: { reglaId: string; error: string }[] = [];

    for (const reglaId of command.reglaIds) {
      try {
        await this.aprobarHandler.execute({ reglaId });
        aprobadas.push(reglaId);
      } catch (err) {
        errores.push({ reglaId, error: (err as Error).message });
      }
    }

    return { aprobadas, errores };
  }
}
