import type { AdminPlanRepository, AdminPlanData } from '../../domain/repositories/admin-plan.repository';
import { RecursoNoEncontradoError, OperacionInvalidaError } from '../../../shared/domain/exceptions';
import type { CrearPlanDto } from '../dtos/crear-plan.dto';
import type { ActualizarPlanDto } from '../dtos/actualizar-plan.dto';

export class AdminPlanesService {
  constructor(private readonly planRepo: AdminPlanRepository) {}

  async findAll(): Promise<AdminPlanData[]> {
    return this.planRepo.findAll();
  }

  async findById(id: number): Promise<AdminPlanData> {
    const plan = await this.planRepo.findById(id);
    if (!plan) throw new RecursoNoEncontradoError('Plan');
    return plan;
  }

  async create(dto: CrearPlanDto): Promise<AdminPlanData> {
    const existing = await this.planRepo.findByCodigo(dto.codigo);
    if (existing) {
      throw new OperacionInvalidaError('El código de plan ya existe');
    }

    return this.planRepo.save({
      codigo: dto.codigo,
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      maxClientes: dto.maxClientes,
      maxUsuarios: dto.maxUsuarios,
      precio: dto.precio,
      isPublico: dto.isPublico ?? true,
      isActivo: true,
      condiciones: dto.condiciones,
    });
  }

  async update(id: number, dto: ActualizarPlanDto): Promise<AdminPlanData> {
    const plan = await this.planRepo.findById(id);
    if (!plan) throw new RecursoNoEncontradoError('Plan');

    if (dto.nombre !== undefined) plan.nombre = dto.nombre;
    if (dto.descripcion !== undefined) plan.descripcion = dto.descripcion;
    if (dto.maxClientes !== undefined) plan.maxClientes = dto.maxClientes;
    if (dto.maxUsuarios !== undefined) plan.maxUsuarios = dto.maxUsuarios;
    if (dto.precio !== undefined) plan.precio = dto.precio;
    if (dto.isPublico !== undefined) plan.isPublico = dto.isPublico;
    if (dto.condiciones !== undefined) plan.condiciones = dto.condiciones;

    return this.planRepo.save(plan);
  }

  async deactivate(id: number): Promise<AdminPlanData> {
    const plan = await this.planRepo.findById(id);
    if (!plan) throw new RecursoNoEncontradoError('Plan');

    plan.isActivo = false;
    return this.planRepo.save(plan);
  }
}
