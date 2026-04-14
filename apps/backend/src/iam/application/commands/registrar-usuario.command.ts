import type { Rol } from '@numerito/shared';
import { Email } from '../../domain/value-objects/email.vo';
import { Password } from '../../domain/value-objects/password.vo';
import { Usuario } from '../../domain/entities/usuario.entity';
import type { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import type { EventBus } from '../../../shared/domain/event-bus';
import { EmailYaRegistradoError } from '../../../shared/domain/exceptions';

export interface RegistrarUsuarioCommand {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  rol: Rol;
}

export interface RegistrarUsuarioResult {
  id: string;
  email: string;
}

export class RegistrarUsuarioHandler {
  constructor(
    private readonly usuarioRepo: UsuarioRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RegistrarUsuarioCommand): Promise<RegistrarUsuarioResult> {
    const email = Email.create(command.email);

    const existing = await this.usuarioRepo.findByEmail(email);
    if (existing) {
      throw new EmailYaRegistradoError();
    }

    const password = await Password.create(command.password);

    const usuario = Usuario.create({
      email,
      password,
      nombre: command.nombre,
      apellido: command.apellido,
      rol: command.rol,
    });

    await this.usuarioRepo.save(usuario);

    this.eventBus.publishAll(usuario.getDomainEvents());
    usuario.clearDomainEvents();

    return {
      id: usuario.id,
      email: usuario.email.value,
    };
  }
}
