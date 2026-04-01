import { Email } from '../../domain/value-objects/email.vo';
import type { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import type { TokenService } from '../services/token.service';

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
      throw new Error('Credenciales inválidas');
    }

    if (!usuario.isActive) {
      throw new Error('Usuario inactivo');
    }

    const isValidPassword = await usuario.password.compare(command.password);
    if (!isValidPassword) {
      throw new Error('Credenciales inválidas');
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
      },
    };
  }
}
