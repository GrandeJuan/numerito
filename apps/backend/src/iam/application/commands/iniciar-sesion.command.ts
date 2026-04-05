import { Email } from '../../domain/value-objects/email.vo';
import type { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import type { TokenService } from '../services/token.service';
import { CredencialesInvalidasError, UsuarioInactivoError } from '../../../shared/domain/exceptions';

export interface IniciarSesionCommand {
  email: string;
  password: string;
}

export interface IniciarSesionResult {
  accessToken: string;
  refreshToken: string;
  usuario: {
    id: string;
    email: string;
    nombre: string;
    apellido: string;
    rol: string;
    themePreference: string;
  };
}

export class IniciarSesionHandler {
  constructor(
    private readonly usuarioRepo: UsuarioRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(command: IniciarSesionCommand): Promise<IniciarSesionResult> {
    const email = Email.create(command.email);
    const usuario = await this.usuarioRepo.findByEmail(email);

    if (!usuario) {
      throw new CredencialesInvalidasError();
    }

    if (!usuario.isActive) {
      throw new UsuarioInactivoError();
    }

    const isValidPassword = await usuario.password.compare(command.password);
    if (!isValidPassword) {
      throw new CredencialesInvalidasError();
    }

    const payload = {
      sub: usuario.id,
      email: usuario.email.value,
      rol: usuario.rol,
    };

    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      usuario: {
        id: usuario.id,
        email: usuario.email.value,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
        themePreference: usuario.themePreference,
      },
    };
  }
}
