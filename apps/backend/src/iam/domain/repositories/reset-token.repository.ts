export interface ResetTokenData {
  usuarioId: string;
  token: string;
  expiresAt: Date;
}

export interface ResetTokenRepository {
  save(data: ResetTokenData): Promise<void>;
  findByToken(token: string): Promise<ResetTokenData | null>;
  deleteByUsuarioId(usuarioId: string): Promise<void>;
}

export const RESET_TOKEN_REPOSITORY = Symbol('ResetTokenRepository');
