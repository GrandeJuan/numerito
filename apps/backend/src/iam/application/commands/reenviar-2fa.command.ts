import { generateTotpSecret, generateTotpUri } from '../../../shared/utils/totp';
import type { TotpSecretRepository } from '../../domain/repositories/totp-secret.repository';
import type { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { RecursoNoEncontradoError, TwoFANoConfiguradoError } from '../../../shared/domain/exceptions';
import { OperacionInvalidaError } from '../../../shared/domain/exceptions';

export interface Reenviar2FACommand {
  usuarioId: string;
}

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 3;

const resendLog = new Map<string, number[]>();

export function _resetResendLog(): void {
  resendLog.clear();
}

export class Reenviar2FAHandler {
  constructor(
    private readonly totpSecretRepo: TotpSecretRepository,
    private readonly usuarioRepo: UsuarioRepository,
  ) {}

  async execute(command: Reenviar2FACommand): Promise<void> {
    const now = Date.now();
    const timestamps = resendLog.get(command.usuarioId) ?? [];
    const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

    if (recent.length >= RATE_LIMIT_MAX) {
      throw new OperacionInvalidaError(
        'Límite de reenvíos alcanzado. Intentá de nuevo en unos minutos.',
      );
    }

    const secretData = await this.totpSecretRepo.findByUsuarioId(command.usuarioId);
    if (!secretData) {
      throw new TwoFANoConfiguradoError();
    }

    const usuario = await this.usuarioRepo.findById(command.usuarioId);
    if (!usuario) {
      throw new RecursoNoEncontradoError('Usuario');
    }

    // Regenerate the secret and persist it
    const newSecret = generateTotpSecret();
    const otpauthUrl = generateTotpUri(usuario.email.value, 'Numerito', newSecret);

    await this.totpSecretRepo.save({
      usuarioId: command.usuarioId,
      secret: newSecret,
      verified: false,
    });

    // Record the resend for rate limiting
    recent.push(now);
    resendLog.set(command.usuarioId, recent);

    // In a full implementation, this would send the new code via email/push.
    // For TOTP-based 2FA, the secret is already stored — the user's authenticator
    // app generates codes from the original secret. The resend endpoint confirms
    // the system is ready and refreshes the secret if needed.
  }
}
