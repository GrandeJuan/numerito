import { Email } from '../../domain/value-objects/email.vo';
import { Password } from '../../domain/value-objects/password.vo';
import { Usuario, type AuthProvider } from '../../domain/entities/usuario.entity';
import type { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import type { TokenService } from '../services/token.service';
import { UsuarioInactivoError } from '../../../shared/domain/exceptions';
import { ROL } from '@numerito/shared';

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
    let usuario = await this.usuarioRepo.findByEmail(email);

    if (usuario) {
      if (!usuario.isActive) {
        throw new UsuarioInactivoError();
      }
      // Link SSO provider to existing account
      usuario.linkSsoProvider(command.provider, command.providerId);
      await this.usuarioRepo.save(usuario);
    } else {
      // Create new user with SSO
      const randomPassword = await Password.create(
        `SSO_${Date.now()}_${Math.random().toString(36)}!Aa1`,
      );
      usuario = Usuario.create({
        email,
        password: randomPassword,
        nombre: command.nombre,
        apellido: command.apellido,
        rol: ROL.EMPLEADO,
        provider: command.provider,
        providerId: command.providerId,
      });
      usuario.verifyEmail();
      await this.usuarioRepo.save(usuario);
    }

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
