import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AdminGuard } from '../../../iam/infrastructure/guards/admin.guard';
import { AdminSearchHandler } from '../../application/queries/admin-search.query';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';

@ApiTags('Admin — Search')
@Controller({ path: 'admin/search', version: '1' })
@UseGuards(AdminGuard)
export class AdminSearchController {
  constructor(private readonly searchHandler: AdminSearchHandler) {}

  @Get()
  @ApiOperation({ summary: 'Busqueda global cross-entity (estudios + usuarios)' })
  @ApiQuery({ name: 'q', required: true, description: 'Texto de busqueda' })
  async search(@Query('q') q: string) {
    const result = await this.searchHandler.execute(q ?? '');
    return successResponse(result);
  }
}
