import { UsuarioRegistrado } from './usuario-registrado.event';

describe('UsuarioRegistrado Event', () => {
  it('should create event with usuario data', () => {
    const event = new UsuarioRegistrado('user-123', 'test@example.com');
    expect(event.eventName).toBe('iam.usuario-registrado');
    expect(event.usuarioId).toBe('user-123');
    expect(event.email).toBe('test@example.com');
    expect(event.occurredOn).toBeInstanceOf(Date);
  });
});
