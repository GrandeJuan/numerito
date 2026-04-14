import { Controller, Get, Patch, Param, Inject, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EntityManager, FilterQuery } from '@mikro-orm/core';
import { ESTUDIO_REPOSITORY } from '../../../estudio/domain/repositories/estudio.repository';
import type { EstudioRepository } from '../../../estudio/domain/repositories/estudio.repository';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';
import { AdminGuard } from '../../../iam/infrastructure/guards/admin.guard';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';

@ApiTags('Admin — Estudios')
@Controller({ path: 'admin/estudios', version: '1' })
@UseGuards(AdminGuard)
export class AdminEstudiosController {
  constructor(
    @Inject(ESTUDIO_REPOSITORY) private readonly estudioRepo: EstudioRepository,
    private readonly em: EntityManager,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar estudios con filtros y paginación' })
  async list(@Query() query: Record<string, string>) {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 20;
    const offset = (page - 1) * limit;

    const where: FilterQuery<EstudioEntity> = {};

    if (query.search) {
      const like = `%${query.search.toLowerCase()}%`;
      (where as any).$or = [
        { nombre: { $ilike: like } },
        { cuit: { $ilike: like } },
      ];
    }

    if (query.plan) {
      (where as any).plan = { codigo: query.plan };
    }

    if (query.isActive !== undefined) {
      (where as any).isActive = query.isActive === 'true';
    }

    if (query.from) {
      (where as any).createdAt = { ...((where as any).createdAt || {}), $gte: new Date(query.from) };
    }

    if (query.to) {
      (where as any).createdAt = { ...((where as any).createdAt || {}), $lte: new Date(query.to) };
    }

    const [items, total] = await this.em.findAndCount(EstudioEntity, where, {
      populate: ['plan'],
      orderBy: { createdAt: 'DESC' },
      limit,
      offset,
    });

    return successResponse(
      items.map((e) => ({
        id: e.id,
        nombre: e.nombre,
        cuit: e.cuit,
        plan: e.plan?.nombre ?? 'Sin plan',
        planCodigo: e.plan?.codigo ?? null,
        isActive: e.isActive,
        createdAt: e.createdAt.toISOString(),
      })),
      { total, page, limit },
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener estudio por ID' })
  async getById(@Param('id') id: string) {
    const estudio = await this.estudioRepo.findById(id);
    if (!estudio) throw new RecursoNoEncontradoError('Estudio');
    return estudio;
  }

  @Patch(':id/suspend')
  @ApiOperation({ summary: 'Suspender estudio' })
  async suspend(@Param('id') id: string) {
    const estudio = await this.estudioRepo.findById(id);
    if (!estudio) throw new RecursoNoEncontradoError('Estudio');

    estudio.deactivate();
    await this.estudioRepo.save(estudio);
    return estudio;
  }

  @Patch(':id/reactivate')
  @ApiOperation({ summary: 'Reactivar estudio' })
  async reactivate(@Param('id') id: string) {
    const estudio = await this.estudioRepo.findById(id);
    if (!estudio) throw new RecursoNoEncontradoError('Estudio');

    estudio.activate();
    await this.estudioRepo.save(estudio);
    return estudio;
  }
}
