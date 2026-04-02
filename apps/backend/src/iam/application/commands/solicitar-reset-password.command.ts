import { randomBytes } from 'crypto';
import { Email } from '../../domain/value-objects/email.vo';
import type { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import type { ResetTokenRepository } from '../../domain/repositories/reset-token.repository';
import { AUTH } from '../../../shared/config/constants';

export interface SolicitarResetPasswordCommand {
  email: string;
}

export interface SolicitarResetPasswordResult {
  token: string | null;
}

const TOKEN_EXPIRY_HOURS = AUTH.TOKEN_EXPIRY_HOURS;

export class SolicitarResetPasswordHandler {
  constructor(
    private readonly usuarioRepo: UsuarioRepository,
    private readonly resetTokenRepo: ResetTokenRepository,
  ) {}

  async execute(command: SolicitarResetPasswordCommand): Promise<SolicitarResetPasswordResult> {
    const email = Email.create(command.email);
    const usuario = await this.usuarioRepo.findByEmail(email);

    if (!usuario) {
      return { token: null };
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 3600000);

    await this.resetTokenRepo.save({
      usuarioId: usuario.id,
      token,
      expiresAt,
    });

    return { token };
  }
}
