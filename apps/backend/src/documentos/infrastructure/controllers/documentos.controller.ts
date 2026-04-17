import { Controller, Get, Post, Patch, Param, Body, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CrearDocumentoDto, crearDocumentoDtoSchema } from '../../application/dtos/crear-documento.dto';
import { NuevaVersionDto, nuevaVersionDtoSchema } from '../../application/dtos/nueva-version.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';
import { DOCUMENTO_REPOSITORY } from '../../domain/repositories/documento.repository';
import type { DocumentoRepository } from '../../domain/repositories/documento.repository';
import { Documento } from '../../domain/entities/documento.entity';
import { Principal } from '../../../shared/infrastructure/decorators/estudio-principal.decorator';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

@ApiTags('Documentos')
@Controller({ path: 'documentos', version: '1' })
export class DocumentosController {
  constructor(@Inject(DOCUMENTO_REPOSITORY) private readonly documentoRepo: DocumentoRepository) {}

  @Get()
  @ApiOperation({ summary: 'Listar documentos del estudio' })
  async list(
    @Principal() principal: EstudioPrincipal,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('clienteId') clienteId?: string,
  ) {
    const documentos = clienteId
      ? await this.documentoRepo.findByClienteId(principal, clienteId)
      : await this.documentoRepo.findAll(principal);
    return successResponse(documentos, { total: documentos.length, page: +page, limit: +limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener documento por ID' })
  async getById(@Principal() principal: EstudioPrincipal, @Param('id') id: string) {
    const documento = await this.documentoRepo.findById(principal, id);
    if (!documento) throw new RecursoNoEncontradoError('Documento');
    return successResponse(documento);
  }

  @Post()
  @ApiOperation({ summary: 'Crear documento (metadata)' })
  async create(@Body(new ZodValidationPipe(crearDocumentoDtoSchema)) dto: CrearDocumentoDto, @Principal() principal: EstudioPrincipal) {
    const documento = Documento.create({ ...dto, estudioId: principal.estudioId });
    await this.documentoRepo.save(principal, documento);
    return successResponse(documento);
  }

  @Patch(':id/version')
  @ApiOperation({ summary: 'Nueva version del documento' })
  async newVersion(@Principal() principal: EstudioPrincipal, @Param('id') id: string, @Body(new ZodValidationPipe(nuevaVersionDtoSchema)) dto: NuevaVersionDto) {
    const documento = await this.documentoRepo.findById(principal, id);
    if (!documento) throw new RecursoNoEncontradoError('Documento');
    documento.newVersion(dto.s3Key, dto.sizeBytes);
    await this.documentoRepo.save(principal, documento);
    return successResponse(documento);
  }
}
