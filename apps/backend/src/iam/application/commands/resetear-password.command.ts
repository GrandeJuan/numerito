import { Password } from '../../domain/value-objects/password.vo';
import type { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import type { ResetTokenRepository } from '../../domain/repositories/reset-token.repository';
import { TokenInvalidoError, RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

export interface ResetearPasswordCommand {
  token: string;
  newPassword: string;
}

export class ResetearPasswordHandler {
  constructor(
    private readonly usuarioRepo: UsuarioRepository,
    private readonly resetTokenRepo: ResetTokenRepository,
  ) {}

  async execute(command: ResetearPasswordCommand): Promise<void> {
    const tokenData = await this.resetTokenRepo.findByToken(command.token);

    if (!tokenData || tokenData.expiresAt < new Date()) {
      throw new TokenInvalidoError();
    }

    const usuario = await this.usuarioRepo.findById(tokenData.usuarioId);
    if (!usuario) {
      throw new RecursoNoEncontradoError('Usuario');
    }

    const newPassword = await Password.create(command.newPassword);
    await usuario.changePassword(newPassword);
    await this.usuarioRepo.save(usuario);
    await this.resetTokenRepo.deleteByUsuarioId(tokenData.usuarioId);
  }
}
