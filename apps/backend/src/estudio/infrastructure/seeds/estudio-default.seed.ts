import { NombreEstudio } from '../../domain/value-objects/nombre-estudio.vo';
import { PlanSubscripcion } from '../../domain/value-objects/plan-subscripcion.vo';
import { PLAN } from '@numerito/shared';
import { Estudio } from '../../domain/entities/estudio.entity';

/**
 * Default estudio seed data.
 * Used to initialize the first studio on fresh deployments.
 * Values come from environment variables with sensible dev defaults.
 */
export function getDefaultEstudioSeed() {
  return {
    estudio: {
      nombre: process.env.SEED_ESTUDIO_NOMBRE || 'Estudio Demo',
      plan: (process.env.SEED_ESTUDIO_PLAN as keyof typeof PLAN) || PLAN.PROFESIONAL,
      planLimits: {
        maxClientes: Number(process.env.SEED_ESTUDIO_MAX_CLIENTES) || 50,
        maxUsuarios: Number(process.env.SEED_ESTUDIO_MAX_USUARIOS) || 5,
      },
      cuit: process.env.SEED_ESTUDIO_CUIT || '20-00000000-0',
    },
    admin: {
      nombre: process.env.SEED_ADMIN_NOMBRE || 'Admin',
      apellido: process.env.SEED_ADMIN_APELLIDO || 'Demo',
      email: process.env.SEED_ADMIN_EMAIL || 'admin@demo.com',
      password: process.env.SEED_ADMIN_PASSWORD || 'Admin123!',
      rol: 'SOCIO' as const,
    },
  };
}

export function createDefaultEstudio(): Estudio {
  const { estudio } = getDefaultEstudioSeed();
  return Estudio.create({
    nombre: NombreEstudio.create(estudio.nombre),
    plan: PlanSubscripcion.create(estudio.plan, estudio.planLimits.maxClientes, estudio.planLimits.maxUsuarios),
    cuit: estudio.cuit,
  });
}
