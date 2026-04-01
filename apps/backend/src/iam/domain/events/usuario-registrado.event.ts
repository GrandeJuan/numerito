import { DomainEvent } from '../../../shared/domain';

export class UsuarioRegistrado extends DomainEvent {
  constructor(
    public readonly usuarioId: string,
    public readonly email: string,
  ) {
    super();
  }

  get eventName(): string {
    return 'iam.usuario-registrado';
  }
}
