import { generateTotpSecret, generateTotpUri } from '../../../shared/utils/totp';
import type { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

export interface Activar2FACommand {
  usuarioId: string;
}

export interface Activar2FAResult {
  secret: string;
  otpauthUrl: string;
}

export class Activar2FAHandler {
  constructor(private readonly usuarioRepo: UsuarioRepository) {}

  async execute(command: Activar2FACommand): Promise<Activar2FAResult> {
    const usuario = await this.usuarioRepo.findById(command.usuarioId);
    if (!usuario) {
      throw new RecursoNoEncontradoError('Usuario');
    }

    const secret = generateTotpSecret();
    const otpauthUrl = generateTotpUri(usuario.email.value, 'Numerito', secret);

    return { secret, otpauthUrl };
  }
}
