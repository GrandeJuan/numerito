import { Usuario } from './usuario.entity';
import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';
import { ROL } from '@numerito/shared';
import { UsuarioRegistrado } from '../events/usuario-registrado.event';

describe('Usuario Entity', () => {
  const createUsuario = async () => {
    const email = Email.create('usuario@test.com');
    const password = await Password.create('SecurePass123!');
    return Usuario.create({
      email,
      password,
      nombre: 'Juan',
      apellido: 'Perez',
      rol: ROL.SOCIO,
    });
  };

  it('should create a usuario with valid data', async () => {
    const usuario = await createUsuario();
    expect(usuario.id).toBeDefined();
    expect(usuario.email.value).toBe('usuario@test.com');
    expect(usuario.nombre).toBe('Juan');
    expect(usuario.apellido).toBe('Perez');
    expect(usuario.rol).toBe(ROL.SOCIO);
    expect(usuario.isActive).toBe(true);
    expect(usuario.emailVerified).toBe(false);
  });

  it('should change rol', async () => {
    const usuario = await createUsuario();
    usuario.changeRol(ROL.RESPONSABLE);
    expect(usuario.rol).toBe(ROL.RESPONSABLE);
  });

  it('should deactivate usuario', async () => {
    const usuario = await createUsuario();
    usuario.deactivate();
    expect(usuario.isActive).toBe(false);
  });

  it('should verify email', async () => {
    const usuario = await createUsuario();
    usuario.verifyEmail();
    expect(usuario.emailVerified).toBe(true);
  });

  it('should activate after deactivation', async () => {
    const usuario = await createUsuario();
    usuario.deactivate();
    expect(usuario.isActive).toBe(false);
    usuario.activate();
    expect(usuario.isActive).toBe(true);
  });

  it('should change password', async () => {
    const usuario = await createUsuario();
    const newPassword = await Password.create('NewSecure456!');
    await usuario.changePassword(newPassword);
    expect(usuario.password).toBe(newPassword);
  });

  describe('domain events', () => {
    it('should emit UsuarioRegistrado on create', async () => {
      const usuario = await createUsuario();
      const events = usuario.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UsuarioRegistrado);
      expect((events[0] as UsuarioRegistrado).usuarioId).toBe(usuario.id);
      expect((events[0] as UsuarioRegistrado).email).toBe('usuario@test.com');
    });

    it('should clear domain events', async () => {
      const usuario = await createUsuario();
      expect(usuario.getDomainEvents()).toHaveLength(1);
      usuario.clearDomainEvents();
      expect(usuario.getDomainEvents()).toHaveLength(0);
    });
  });
});
