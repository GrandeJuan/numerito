import type { SesionRepository } from '../../domain/repositories/sesion.repository';

export interface CerrarSesionCommand {
  usuarioId: string;
}

export class CerrarSesionHandler {
  constructor(private readonly sesionRepo: SesionRepository) {}

  async execute(command: CerrarSesionCommand): Promise<{ message: string }> {
    await this.sesionRepo.revokeAllByUsuarioId(command.usuarioId);
    return { message: 'Sesión cerrada exitosamente' };
  }
}
