export interface TokenPayload {
  sub: string;
  email: string;
  rol: string;
}

export interface TokenService {
  generateAccessToken(payload: TokenPayload): string;
  generateRefreshToken(payload: TokenPayload): string;
  verifyRefreshToken(token: string): TokenPayload;
}

export const TOKEN_SERVICE = Symbol('TokenService');
