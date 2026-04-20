import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { AdminGuard } from '../../../iam/infrastructure/guards/admin.guard';
import { Principal } from '../../../shared/infrastructure/decorators/estudio-principal.decorator';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import { ExcelParserService } from '../../application/services/excel-parser.service';
import {
  ImportarExcelHandler,
  type ImportarExcelCommand,
} from '../../application/commands/importar-excel.command';
import * as XLSX from 'xlsx';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

@ApiTags('Admin — Import Clientes')
@Controller({ path: 'admin/clientes/import', version: '1' })
@UseGuards(AdminGuard)
export class ImportAdminController {
  private readonly parser = new ExcelParserService();

  constructor(
    private readonly importarHandler: ImportarExcelHandler,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Importar clientes y vencimientos desde Excel (dry-run por defecto)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async importar(
    @Principal() principal: EstudioPrincipal,
    @UploadedFile() file: Express.Multer.File,
    @Body('dryRun') dryRunParam?: string,
    @Body('estadoHistoricos') estadoHistoricosParam?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó archivo Excel');
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipo de archivo no permitido. Se requiere .xlsx o .xls',
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('El archivo supera el tamaño máximo de 10MB');
    }

    // Parse the Excel buffer
    const workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestException('El archivo Excel no contiene hojas');
    }
    const worksheet = workbook.Sheets[sheetName];
    const rawRows: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      dateNF: 'yyyy-mm-dd',
    });

    const parseResult = this.parser.parse(rawRows);

    if (parseResult.rows.length === 0) {
      return successResponse({
        ...parseResult,
        importResult: null,
        mensaje: 'No se encontraron filas con datos para importar',
      });
    }

    // Default to dry-run=true for safety
    const dryRun = dryRunParam !== 'false';
    const estadoHistoricos =
      estadoHistoricosParam === 'PENDIENTE' ? 'PENDIENTE' : 'PRESENTADO';

    const importResult = await this.importarHandler.execute(principal, {
      rows: parseResult.rows,
      dryRun,
      estadoHistoricos,
    } as ImportarExcelCommand);

    return successResponse({
      parseInfo: {
        headersReconocidos: parseResult.headersReconocidos,
        headersIgnorados: parseResult.headersIgnorados,
        erroresParser: parseResult.errores,
      },
      importResult,
    });
  }
}
