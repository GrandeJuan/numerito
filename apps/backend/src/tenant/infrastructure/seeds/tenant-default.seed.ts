import { NombreEstudio } from '../../domain/value-objects/nombre-estudio.vo';
import { PlanSubscripcion, PLAN } from '../../domain/value-objects/plan-subscripcion.vo';
import { Estudio } from '../../domain/entities/estudio.entity';

/**
 * Default tenant seed data.
 * Used to initialize the first studio on fresh deployments.
 */
export const DEFAULT_TENANT_SEED = {
  estudio: {
    nombre: 'Grande & Asociados',
    plan: PLAN.PROFESIONAL,
    planLimits: { maxClientes: 50, maxUsuarios: 5 },
    cuit: '20-12345678-6',
  },
  admin: {
    nombre: 'Admin',
    apellido: 'Grande',
    email: 'admin@grandecontadores.com',
    password: 'Admin123!',
    rol: 'SOCIO' as const,
  },
};

export function createDefaultEstudio(): Estudio {
  const { estudio } = DEFAULT_TENANT_SEED;
  return Estudio.create({
    nombre: NombreEstudio.create(estudio.nombre),
    plan: PlanSubscripcion.create(estudio.plan, estudio.planLimits.maxClientes, estudio.planLimits.maxUsuarios),
    cuit: estudio.cuit,
  });
}
