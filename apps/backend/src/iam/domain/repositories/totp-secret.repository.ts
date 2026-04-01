export interface TotpSecretData {
  usuarioId: string;
  secret: string;
  verified: boolean;
}

export interface TotpSecretRepository {
  save(data: TotpSecretData): Promise<void>;
  findByUsuarioId(usuarioId: string): Promise<TotpSecretData | null>;
  deleteByUsuarioId(usuarioId: string): Promise<void>;
}

export const TOTP_SECRET_REPOSITORY = Symbol('TotpSecretRepository');
