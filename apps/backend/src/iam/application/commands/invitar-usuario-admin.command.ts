import type { Rol } from '@numerito/shared';
import type { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import type { EventBus } from '../../../shared/domain/event-bus';
import { Email } from '../../domain/value-objects/email.vo';
import { Password } from '../../domain/value-objects/password.vo';
import { Usuario } from '../../domain/entities/usuario.entity';
import { EmailYaRegistradoError } from '../../../shared/domain/exceptions';
import { randomBytes } from 'crypto';

export interface InvitarUsuarioAdminCommand {
  email: string;
  nombre?: string;
  rol: Rol;
}

export interface InvitarUsuarioAdminResult {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
}

export class InvitarUsuarioAdminHandler {
  constructor(
    private readonly usuarioRepo: UsuarioRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: InvitarUsuarioAdminCommand): Promise<InvitarUsuarioAdminResult> {
    const email = Email.create(command.email);

    const existing = await this.usuarioRepo.findByEmail(email);
    if (existing) throw new EmailYaRegistradoError();

    const tempPassword = randomBytes(16).toString('hex');
    const password = await Password.create(tempPassword);

    const nombre = command.nombre ?? '';
    const usuario = Usuario.create({
      email,
      password,
      nombre,
      apellido: '',
      rol: command.rol,
    });

    await this.usuarioRepo.save(usuario);

    this.eventBus.publishAll(usuario.getDomainEvents());
    usuario.clearDomainEvents();

    return {
      id: usuario.id,
      email: usuario.email.value,
      nombre,
      rol: command.rol,
    };
  }
}
