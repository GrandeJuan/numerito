import { Controller, Get, Post, Put, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Nomina')
@Controller({ path: 'nomina', version: '1' })
export class NominaController {
  @Get('empleados')
  @ApiOperation({ summary: 'Listar empleados' })
  async list(@Query('page') _page = 1, @Query('limit') _limit = 20) {
    return [];
  }
}
