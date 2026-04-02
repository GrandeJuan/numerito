import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Tareas')
@Controller({ path: 'tareas', version: '1' })
export class TareasController {
  @Get()
  @ApiOperation({ summary: 'Listar tareas' })
  async list(@Query('page') _page = 1, @Query('limit') _limit = 20) {
    return [];
  }
}
