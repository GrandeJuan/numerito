import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Documentos')
@Controller({ path: 'documentos', version: '1' })
export class DocumentosController {
  @Get()
  @ApiOperation({ summary: 'Listar documentos' })
  async list(@Query('page') _page = 1, @Query('limit') _limit = 20) {
    return [];
  }
}
