import type { EstudioRepository } from '../../domain/repositories/estudio.repository';
import type { AdminPlanRepository } from '../../../administracion/domain/repositories/admin-plan.repository';
import type { EventBus } from '../../../shared/domain/event-bus';
import { Estudio } from '../../domain/entities/estudio.entity';
import {
  Subscripcion,
  EstadoSubscripcion,
  CicloFacturacion,
} from '../../domain/entities/subscripcion.entity';
import { NombreEstudio } from '../../domain/value-objects/nombre-estudio.vo';
import { PlanSubscripcion } from '../../domain/value-objects/plan-subscripcion.vo';
import { CuitDuplicadoError, RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

export interface CrearEstudioAdminCommand {
  nombre: string;
  cuit: string;
  planCodigo: string;
  trialDias?: number;
}

export interface CrearEstudioAdminResult {
  id: string;
  nombre: string;
  cuit: string;
  plan: string;
  subscripcionId: string;
}

export class CrearEstudioAdminHandler {
  constructor(
    private readonly estudioRepo: EstudioRepository,
    private readonly planRepo: AdminPlanRepository,
    private readonly eventBus: EventBus,
    private readonly saveSubscripcion: (sub: Subscripcion) => Promise<void>,
  ) {}

  async execute(command: CrearEstudioAdminCommand): Promise<CrearEstudioAdminResult> {
    const existing = await this.estudioRepo.findByCuit(command.cuit);
    if (existing) throw new CuitDuplicadoError();

    const planData = await this.planRepo.findByCodigo(command.planCodigo);
    if (!planData) throw new RecursoNoEncontradoError('Plan');

    const nombre = NombreEstudio.create(command.nombre);
    const plan = PlanSubscripcion.create(
      planData.codigo as any,
      planData.maxClientes,
      planData.maxUsuarios,
    );

    const estudio = Estudio.create({ nombre, plan, cuit: command.cuit });

    const trialDias = command.trialDias ?? 30;
    const ahora = new Date();
    const fechaFin = new Date(ahora);
    fechaFin.setDate(fechaFin.getDate() + trialDias);

    const subscripcion = Subscripcion.create({
      estudioId: estudio.id,
      planId: String(planData.id ?? planData.codigo),
      fechaInicio: ahora,
      fechaFin,
      estado: EstadoSubscripcion.TRIAL,
      cicloFacturacion: CicloFacturacion.MENSUAL,
      autoRenovacion: true,
    });

    await this.estudioRepo.save(estudio);
    await this.saveSubscripcion(subscripcion);

    this.eventBus.publishAll([...estudio.getDomainEvents(), ...subscripcion.getDomainEvents()]);
    estudio.clearDomainEvents();
    subscripcion.clearDomainEvents();

    return {
      id: estudio.id,
      nombre: estudio.nombre.value,
      cuit: estudio.cuit,
      plan: planData.nombre,
      subscripcionId: subscripcion.id,
    };
  }
}
