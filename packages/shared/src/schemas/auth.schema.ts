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
