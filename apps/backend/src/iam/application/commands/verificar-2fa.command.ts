import { verifyTotp } from '../../../shared/utils/totp';
import type { TotpSecretRepository } from '../../domain/repositories/totp-secret.repository';

export interface Verificar2FACommand {
  usuarioId: string;
  code: string;
}

export interface Verificar2FAResult {
  valid: boolean;
}

export class Verificar2FAHandler {
  constructor(
    private readonly _usuarioRepo: unknown,
    private readonly totpSecretRepo: TotpSecretRepository,
  ) {}

  async execute(command: Verificar2FACommand): Promise<Verificar2FAResult> {
    const secretData = await this.totpSecretRepo.findByUsuarioId(command.usuarioId);
    if (!secretData) {
      throw new Error('2FA no configurado');
    }

    const isValid = verifyTotp(secretData.secret, command.code);

    if (isValid && !secretData.verified) {
      await this.totpSecretRepo.save({
        ...secretData,
        verified: true,
      });
    }

    return { valid: isValid };
  }
}
