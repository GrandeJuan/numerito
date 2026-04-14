import { Controller, Get, Post, Patch, Param, Body, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CrearDocumentoDto, crearDocumentoDtoSchema } from '../../application/dtos/crear-documento.dto';
import { NuevaVersionDto, nuevaVersionDtoSchema } from '../../application/dtos/nueva-version.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';
import { DOCUMENTO_REPOSITORY } from '../../domain/repositories/documento.repository';
import type { DocumentoRepository } from '../../domain/repositories/documento.repository';
import { Documento } from '../../domain/entities/documento.entity';
import { EstudioId } from '../../../shared/infrastructure/decorators/estudio-id.decorator';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

@ApiTags('Documentos')
@Controller({ path: 'documentos', version: '1' })
export class DocumentosController {
  constructor(@Inject(DOCUMENTO_REPOSITORY) private readonly documentoRepo: DocumentoRepository) {}

  @Get()
  @ApiOperation({ summary: 'Listar documentos del estudio' })
  async list(
    @EstudioId() estudioId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('clienteId') clienteId?: string,
  ) {
    const documentos = clienteId
      ? await this.documentoRepo.findByClienteId(clienteId)
      : await this.documentoRepo.findAll();
    return successResponse(documentos, { total: documentos.length, page: +page, limit: +limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener documento por ID' })
  async getById(@Param('id') id: string) {
    const documento = await this.documentoRepo.findById(id);
    if (!documento) throw new RecursoNoEncontradoError('Documento');
    return successResponse(documento);
  }

  @Post()
  @ApiOperation({ summary: 'Crear documento (metadata)' })
  async create(@Body(new ZodValidationPipe(crearDocumentoDtoSchema)) dto: CrearDocumentoDto, @EstudioId() estudioId: string) {
    const documento = Documento.create({ ...dto, estudioId });
    await this.documentoRepo.save(documento);
    return successResponse(documento);
  }

  @Patch(':id/version')
  @ApiOperation({ summary: 'Nueva version del documento' })
  async newVersion(@Param('id') id: string, @Body(new ZodValidationPipe(nuevaVersionDtoSchema)) dto: NuevaVersionDto) {
    const documento = await this.documentoRepo.findById(id);
    if (!documento) throw new RecursoNoEncontradoError('Documento');
    documento.newVersion(dto.s3Key, dto.sizeBytes);
    await this.documentoRepo.save(documento);
    return successResponse(documento);
  }
}
