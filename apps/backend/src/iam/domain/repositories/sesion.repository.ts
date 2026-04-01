import { Sesion } from '../entities/sesion.entity';

export interface SesionRepository {
  findByUsuarioId(usuarioId: string): Promise<Sesion[]>;
  findByRefreshToken(refreshToken: string): Promise<Sesion | null>;
  save(sesion: Sesion): Promise<void>;
  revokeAllByUsuarioId(usuarioId: string): Promise<void>;
}

export const SESION_REPOSITORY = Symbol('SesionRepository');
