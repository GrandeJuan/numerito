import { Email } from '../../domain/value-objects/email.vo';
import type { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import type { TokenService } from '../services/token.service';
import {
  UsuarioInactivoError,
  UsuarioNoRegistradoSsoError,
} from '../../../shared/domain/exceptions';

export interface AutenticarSsoCommand {
  provider: 'google' | 'microsoft';
  providerId: string;
  email: string;
  nombre: string;
  apellido: string;
}

export interface AutenticarSsoResult {
  accessToken: string;
  refreshToken: string;
  usuario: {
    id: string;
    email: string;
    nombre: string;
    apellido: string;
    rol: string;
  };
}

export class AutenticarSsoHandler {
  constructor(
    private readonly usuarioRepo: UsuarioRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(command: AutenticarSsoCommand): Promise<AutenticarSsoResult> {
    const email = Email.create(command.email);
    const usuario = await this.usuarioRepo.findByEmail(email);

    if (!usuario) {
      throw new UsuarioNoRegistradoSsoError();
    }

    if (!usuario.isActive) {
      throw new UsuarioInactivoError();
    }

    usuario.linkSsoProvider(command.provider, command.providerId);
    await this.usuarioRepo.save(usuario);

    const payload = {
      sub: usuario.id,
      email: usuario.email.value,
      rol: usuario.rol,
    };

    return {
      accessToken: this.tokenService.generateAccessToken(payload),
      refreshToken: this.tokenService.generateRefreshToken(payload),
      usuario: {
        id: usuario.id,
        email: usuario.email.value,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
      },
    };
  }
}
