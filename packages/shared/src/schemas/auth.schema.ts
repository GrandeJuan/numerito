import { z } from 'zod';

// ── Login ───────────────────────────────────────────────────────────────

export const iniciarSesionSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type IniciarSesionInput = z.infer<typeof iniciarSesionSchema>;

export const sesionResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    nombre: z.string(),
    apellido: z.string(),
    rol: z.string(),
  }),
});

export type SesionResponse = z.infer<typeof sesionResponseSchema>;

// ── Register ────────────────────────────────────────────────────────────

export const registrarUsuarioSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  rol: z.string().min(1),
});

export type RegistrarUsuarioInput = z.infer<typeof registrarUsuarioSchema>;

// ── Reset password ─────────────────────────────────────────────────────

export const solicitarResetPasswordSchema = z.object({
  email: z.string().email(),
});

export type SolicitarResetPasswordInput = z.infer<typeof solicitarResetPasswordSchema>;

export const resetearPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

export type ResetearPasswordInput = z.infer<typeof resetearPasswordSchema>;

// ── Refresh token ──────────────────────────────────────────────────────

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

// ── 2FA ────────────────────────────────────────────────────────────────

export const verificar2FASchema = z.object({
  code: z.string().length(6),
});

export type Verificar2FAInput = z.infer<typeof verificar2FASchema>;
