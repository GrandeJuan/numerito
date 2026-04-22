import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Query,
  BadRequestException,
  Inject,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { ObtenerEstudiosUsuarioHandler } from '../../application/queries/obtener-estudios-usuario.query';
import { ObtenerPermisosUsuarioHandler } from '../../application/queries/obtener-permisos-usuario.query';
import { USUARIO_REPOSITORY } from '../../domain/repositories/usuario.repository';
import type { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { AVATAR_STORAGE } from '../../domain/ports/avatar-storage.port';
import type { AvatarStoragePort } from '../../domain/ports/avatar-storage.port';
import { JwtAuthGuard } from '../../../shared/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

@ApiTags('Usuarios')
@Controller({ path: 'usuarios', version: '1' })
@UseGuards(JwtAuthGuard)
export class UsuarioController {
  constructor(
    private readonly obtenerEstudiosHandler: ObtenerEstudiosUsuarioHandler,
    private readonly obtenerPermisosHandler: ObtenerPermisosUsuarioHandler,
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepo: UsuarioRepository,
    @Inject(AVATAR_STORAGE) private readonly avatarStorage: AvatarStoragePort,
  ) {}

  @Get('me/estudios')
  @ApiOperation({ summary: 'Obtener estudios del usuario autenticado' })
  async getMisEstudios(@CurrentUser('sub') usuarioId: string) {
    return this.obtenerEstudiosHandler.execute({ usuarioId });
  }

  @Get('me/permisos')
  @ApiOperation({ summary: 'Obtener permisos del usuario en un estudio' })
  @ApiQuery({ name: 'estudioId', required: true, type: String })
  async getMisPermisos(
    @CurrentUser('sub') usuarioId: string,
    @Query('estudioId') estudioId: string,
  ) {
    if (!estudioId) throw new BadRequestException('estudioId is required');
    const permisos = await this.obtenerPermisosHandler.execute({ usuarioId, estudioId });
    return successResponse(permisos);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Actualizar perfil del usuario autenticado' })
  async updateProfile(
    @CurrentUser('sub') usuarioId: string,
    @Body() body: { nombre?: string; apellido?: string },
  ) {
    const nombre = body.nombre?.trim();
    const apellido = body.apellido?.trim();
    if (!nombre || !apellido) {
      throw new BadRequestException('nombre y apellido son requeridos');
    }

    const usuario = await this.usuarioRepo.findById(usuarioId);
    if (!usuario) throw new BadRequestException('Usuario no encontrado');

    usuario.updateProfile(nombre, apellido);
    await this.usuarioRepo.save(usuario);

    return successResponse({
      id: usuario.id,
      email: usuario.email.value,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol: usuario.rol,
      avatarUrl: usuario.avatarUrl,
      themePreference: usuario.themePreference,
    });
  }

  @Patch('me/preferencias')
  @ApiOperation({ summary: 'Actualizar preferencias del usuario' })
  async updatePreferencias(
    @CurrentUser('sub') usuarioId: string,
    @Body() body: { themePreference?: 'light' | 'dark' },
  ) {
    const usuario = await this.usuarioRepo.findById(usuarioId);
    if (!usuario) throw new BadRequestException('Usuario no encontrado');

    if (body.themePreference) {
      usuario.changeThemePreference(body.themePreference);
    }

    await this.usuarioRepo.save(usuario);
    return successResponse({ themePreference: usuario.themePreference });
  }

  @Get('me')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  async getProfile(@CurrentUser('sub') usuarioId: string) {
    const usuario = await this.usuarioRepo.findById(usuarioId);
    if (!usuario) throw new BadRequestException('Usuario no encontrado');

    return successResponse({
      id: usuario.id,
      email: usuario.email.value,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol: usuario.rol,
      avatarUrl: usuario.avatarUrl,
      themePreference: usuario.themePreference,
    });
  }

  @Post('me/avatar')
  @ApiOperation({ summary: 'Subir avatar del usuario' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @CurrentUser('sub') usuarioId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No se proporcionó archivo');
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de archivo no permitido. Use JPG, PNG o WebP');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('El archivo supera el tamaño máximo de 2MB');
    }

    const usuario = await this.usuarioRepo.findById(usuarioId);
    if (!usuario) throw new BadRequestException('Usuario no encontrado');

    // Delete old avatar if exists
    if (usuario.avatarUrl) {
      await this.avatarStorage.delete(usuario.avatarUrl);
    }

    const avatarUrl = await this.avatarStorage.upload(usuarioId, file.buffer, file.mimetype);
    usuario.updateAvatarUrl(avatarUrl);
    await this.usuarioRepo.save(usuario);

    return successResponse({ avatarUrl });
  }

  @Delete('me/avatar')
  @ApiOperation({ summary: 'Eliminar avatar del usuario' })
  async deleteAvatar(@CurrentUser('sub') usuarioId: string) {
    const usuario = await this.usuarioRepo.findById(usuarioId);
    if (!usuario) throw new BadRequestException('Usuario no encontrado');

    if (usuario.avatarUrl) {
      await this.avatarStorage.delete(usuario.avatarUrl);
      usuario.removeAvatar();
      await this.usuarioRepo.save(usuario);
    }

    return successResponse({ avatarUrl: null });
  }
}
