import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Contabilidad')
@Controller({ path: 'contabilidad', version: '1' })
export class ContabilidadController {
  @Get('libros')
  @ApiOperation({ summary: 'Listar libros contables' })
  async listLibros(@Query('page') _page = 1, @Query('limit') _limit = 20) {
    return [];
  }

  @Get('asientos')
  @ApiOperation({ summary: 'Listar asientos contables' })
  async listAsientos(@Query('libroId') _libroId: string) {
    return [];
  }
}
